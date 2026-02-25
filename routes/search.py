import os
import time
import random
import logging
from fastapi import APIRouter, Request

from schemas import SearchRequest
from core_helpers import TEMP_DOWNLOADS

logger = logging.getLogger("office-ai-mate.search")

router = APIRouter()

# --- Global Search Cache ---
SEARCH_CACHE = {}
CACHE_TTL = 600 # 10 minutes

# Try import search dependencies
curl_cffi_installed = False
AsyncSession = None
try:
    import curl_cffi.requests
    AsyncSession = curl_cffi.requests.AsyncSession
    curl_cffi_installed = True
except ImportError:
    pass

@router.post("/search")
async def search(request: SearchRequest, raw_request: Request):
    logger.info("Search Request: %s (Page %d)", request.query, request.page)
    logger.debug("Processing Page %d with Max Results %d", request.page, request.max_results)
    optimized_query = request.query
    
    current_time = time.time()
    keys_to_remove = [k for k, v in SEARCH_CACHE.items() if current_time - v['ts'] > CACHE_TTL]
    for k in keys_to_remove:
        del SEARCH_CACHE[k]

    cached_data = SEARCH_CACHE.get(optimized_query)
    
    if request.page > 1 and cached_data:
        start_idx = (request.page - 1) * request.max_results
        end_idx = start_idx + request.max_results
        
        if len(cached_data['results']) >= end_idx:
            logger.info("Serving Page %d from CACHE (%d items cached)", request.page, len(cached_data['results']))
            return {"results": cached_data['results'][start_idx:end_idx], "optimized_query": optimized_query}
        else:
            logger.info("Cache exhausted for Page %d (only %d items)", request.page, len(cached_data['results']))

    results = []
    errors = []
    seen_urls = set()
    
    if cached_data:
        for r in cached_data['results']:
            seen_urls.add(r['href'])

    def add_result(title, href, body):
        if not href or href in seen_urls: return
        if not href.startswith("http"): return 
        
        for r in results:
            if r['title'] == title.strip(): return
        
        if cached_data:
             for r in cached_data['results']:
                 if r['title'] == title.strip(): return

        seen_urls.add(href)
        item = {
            "title": title.strip(),
            "href": href.strip(),
            "body": body.strip()
        }
        results.append(item)
        if cached_data:
             cached_data['results'].append(item)

    global curl_cffi_installed
    global AsyncSession
    httpx_module = None
    bs4_module = None
    ddgs_module = None

    try:
        import httpx
        from bs4 import BeautifulSoup
        from duckduckgo_search import DDGS
        httpx_module = httpx
        bs4_module = BeautifulSoup
        ddgs_module = DDGS
    except ImportError as e:
        logger.warning("搜索依赖缺失: %s (请检查 requirements.txt)", e)

    USER_AGENTS_POOL = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    ]

    BASE_HEADERS = {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "DNT": "1",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "User-Agent": USER_AGENTS_POOL[0] 
    }
    
    def generic_parse(html, source_name):
        soup = bs4_module(html, "html.parser")
        found = []
        
        potential_items = soup.select(".result, .c-result, .c-container, .vrwrap, .rb, .res-list, .b_algo, .lib-box, li")
        
        for item in potential_items:
            title_tag = item.select_one("h3 a, h2 a, h3, h2")
            if not title_tag: continue
            
            if title_tag.name in ['h3', 'h2']:
                if title_tag.find('a'):
                    title_tag = title_tag.find('a')
                else:
                    continue

            link = title_tag.get("href", "")
            if not link or link.startswith("javascript") or link == "#": continue
            
            title = title_tag.get_text(strip=True)
            if not title: continue

            snippet_cat = item.select_one(".c-abstract, .text-layout, .res-desc, .b_caption p, .b_snippet, .content-right_8Zs40, .ft, p")
            body = snippet_cat.get_text(strip=True) if snippet_cat else ""
            
            if source_name == "Sogou" and link.startswith("/link"): link = "https://www.sogou.com" + link
            if source_name == "Baidu" and link.startswith("/"): link = "https://www.baidu.com" + link
            
            found.append({'title': title, 'href': link, 'body': body})
            
        return found

    if bs4_module:
        try:
            time.sleep(random.uniform(0.5, 1.5))
            page = request.page
            params = {"wd": optimized_query}
            headers = BASE_HEADERS.copy()
            headers["Host"] = "www.baidu.com"
            if page > 1: params["pn"] = (page - 1) * 10
            
            resp_text = ""
            if curl_cffi_installed:
                try:
                    async with AsyncSession(impersonate="chrome120", verify=False, timeout=10) as client:
                        resp = await client.get("https://www.baidu.com/s", params=params, headers=headers)
                        resp_text = resp.text
                except Exception as cf_e:
                    errors.append(f"Baidu (curl_cffi error): {str(cf_e)}")
            
            if not resp_text and httpx_module:
                headers["User-Agent"] = random.choice(USER_AGENTS_POOL)
                async with httpx_module.AsyncClient(timeout=6, verify=False) as client:
                    resp = await client.get("https://www.baidu.com/s", params=params, headers=headers)
                    resp_text = resp.text

            if len(resp_text) > 2000:
                items = generic_parse(resp_text, "Baidu")
                if items:
                    for item in items:
                        add_result(item['title'], item['href'], item['body'])
                        if len(results) >= request.max_results: break
                else:
                    errors.append(f"Baidu: Parsed 0 items (Len: {len(resp_text)})")
            elif resp_text:
                snippet = resp_text[:100].replace("\n", " ")
                errors.append(f"Baidu: Blocked (Len: {len(resp_text)}, Content: {snippet}...)")
            else:
                errors.append("Baidu: No response text")

        except Exception as e:
            errors.append(f"Baidu (General): {str(e)}")


    if len(results) < request.max_results and bs4_module:
        try:
            page = int(request.page)
            first = (page - 1) * 10 + 1
            params = {"q": optimized_query, "first": first, "count": 10, "setmkt": "en-US"}
            logger.debug("Bing Params: %s", params)
            headers = BASE_HEADERS.copy()
            
            resp_text = ""
            if curl_cffi_installed:
                try:
                    async with AsyncSession(impersonate="chrome120", verify=False, timeout=15) as client:
                        resp = await client.get("https://www.bing.com/search", params=params, headers=headers)
                        resp_text = resp.text
                except Exception as cf_e:
                     errors.append(f"Bing (curl_cffi error): {str(cf_e)}")

            if not resp_text and httpx_module:
                headers["User-Agent"] = random.choice(USER_AGENTS_POOL)
                async with httpx_module.AsyncClient(timeout=10, verify=False) as client:
                    resp = await client.get("https://www.bing.com/search", params=params, headers=headers)
                    resp_text = resp.text

            if resp_text:
                items = generic_parse(resp_text, "Bing")
                for item in items:
                    add_result(item['title'], item['href'], item['body'])
                    if len(results) >= request.max_results: break
                if not results:
                     errors.append(f"Bing: No results (Len: {len(resp_text)})")
            else:
                errors.append("Bing: No response text")
                 
        except Exception as e:
            errors.append(f"Bing: {str(e)}")

    start_index = (request.page - 1) * request.max_results
    needed_count = 60 if request.page == 1 else (start_index + request.max_results + 5)
    
    if ddgs_module and len(results) < request.max_results:
        ddg_backends = ['api', 'html', 'lite']
        ddg_success = False
        
        for backend in ddg_backends:
            if ddg_success: break
            try:
                logger.info("Trying DuckDuckGo (Backend: %s) for '%s' (Need %d)", backend, optimized_query, needed_count)
                with ddgs_module() as ddgs:
                    ddgs_results = ddgs.text(
                        optimized_query, 
                        region='wt-wt', 
                        safesearch='moderate', 
                        timelimit='y', 
                        max_results=needed_count,
                        backend=backend
                    )
                    
                    if ddgs_results:
                        valid_items_found = 0
                        current_idx = 0
                        all_found_items = []

                        for r in ddgs_results:
                            item_title = r.get('title', '')
                            item_href = r.get('href', '')
                            item_body = r.get('body', '')
                            
                            if not item_href: continue

                            all_found_items.append({
                                "title": item_title,
                                "href": item_href,
                                "body": item_body
                            })

                            current_idx += 1
                            if current_idx <= start_index: continue
                            
                            add_result(item_title, item_href, item_body)
                            if len(results) >= request.max_results:
                                pass  

                        if results:
                            ddg_success = True
                            logger.info("DuckDuckGo (%s) success. Found %d items", backend, len(results))
            except Exception as ddg_e:
                logger.warning("DuckDuckGo (%s) failed: %s", backend, ddg_e)
                errors.append(f"DDG-{backend}: {str(ddg_e)}")
    
    if not results:
        all_errors = "; ".join(errors)
        logger.error("All search attempts failed. %s", all_errors)
        
        friendly_body = "搜索服务暂不可用 (所有引擎均失败)"
        if "No results" in all_errors:
             friendly_body += " - 访问成功但无法解析内容 (反爬/验证码)"
        if "timeout" in all_errors or "ConnectError" in all_errors:
             friendly_body += " - 网络连接问题"
             
        results.append({
            "title": "❌ 搜索失败",
            "href": "#",
            "body": f"{friendly_body}\n调试日志: {all_errors}"
        })

    if request.page == 1 and results:
        SEARCH_CACHE[optimized_query] = {
            "ts": time.time(),
            "results": results 
        }
        final_results = results[:request.max_results]
        return {"results": final_results, "original_query": request.query, "optimized_query": optimized_query}
    
    if request.page > 1 and results:
         return {"results": results[:request.max_results], "original_query": request.query, "optimized_query": optimized_query}

    return {"results": results, "original_query": request.query, "optimized_query": optimized_query}
