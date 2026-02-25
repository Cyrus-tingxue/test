import { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import { Login } from './pages/Login';
import { Home } from './pages/Home';
import { FreeChat } from './pages/FreeChat';
import { CodeAssistant } from './pages/CodeAssistant';
import { Search } from './pages/Search';
import { Clone } from './pages/Clone';
import { Creative } from './pages/Creative';
import { ExcelAssistant } from './pages/ExcelAssistant';
import { Converter } from './pages/Converter';
import { Viz } from './pages/Viz';
import { MindMap } from './pages/MindMap';
import { PPTHelper } from './pages/PPTHelper';
import { Game } from './pages/Game';
import { MarkdownEditor } from './pages/MarkdownEditor';
import { SystemControl } from './pages/SystemControl';
import { Layout } from './Layout';

const AuthRoute = ({ children }) => {
  const { authToken } = useContext(AuthContext);
  return authToken ? children : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<AuthRoute><Layout /></AuthRoute>}>
          <Route index element={<Home />} />

          {/* 工具列表 */}
          <Route path="free_chat" element={<FreeChat />} />
          <Route path="clone" element={<Clone />} />
          <Route path="search" element={<Search />} />
          <Route path="code" element={<CodeAssistant />} />
          <Route path="creative" element={<Creative />} />
          <Route path="excel" element={<ExcelAssistant />} />
          <Route path="converter" element={<Converter />} />
          <Route path="viz" element={<Viz />} />
          <Route path="mindmap" element={<MindMap />} />
          <Route path="ppt" element={<PPTHelper />} />
          <Route path="game" element={<Game />} />
          <Route path="markdown" element={<MarkdownEditor />} />
          <Route path="system" element={<SystemControl />} />

          <Route path="*" element={<Home />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
