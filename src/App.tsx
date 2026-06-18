import { Home } from "./pages/Home";
import { ImportPage } from "./pages/ImportPage";
import { useUiStore } from "./store/uiStore";

function App() {
  const showImportPage = useUiStore((s) => s.showImportPage);

  if (showImportPage) {
    return <ImportPage />;
  }

  return <Home />;
}

export default App;
