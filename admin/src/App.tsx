import { Refine, WelcomePage, Authenticated } from "@refinedev/core";
import { DevtoolsPanel, DevtoolsProvider } from "@refinedev/devtools";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";

import {
  AuthPage,
  ErrorComponent,
  useNotificationProvider,
  ThemedLayout,
  ThemedSider,
} from "@refinedev/antd";
import "@refinedev/antd/dist/reset.css";

import { App as AntdApp } from "antd";
import { BrowserRouter, Route, Routes, Outlet } from "react-router";
import routerProvider, {
  NavigateToResource,
  CatchAllNavigate,
  UnsavedChangesNotifier,
  DocumentTitleHandler,
} from "@refinedev/react-router";
import { FormList, FormCreate, FormEdit } from "./pages/forms";
import { PageList, PageEditor, PageRender } from "./pages/pages";
import { ColorModeContextProvider } from "./contexts/color-mode";
import { Header } from "./components/header";
import { dataProvider } from "./providers/data";

function App() {
  return (
    <BrowserRouter>
      <RefineKbarProvider>
        <ColorModeContextProvider>
          <AntdApp>
            <DevtoolsProvider>
              <Refine
                notificationProvider={useNotificationProvider}
                routerProvider={routerProvider}
                dataProvider={dataProvider}
                resources={[
                  {
                    name: "admin/forms",
                    list: "/forms",
                    create: "/forms/create",
                    edit: "/forms/edit/:id",
                    meta: {
                      label: "Formularze",
                      canDelete: true,
                    },
                  },
                  {
                    name: "admin/pages",
                    list: "/pages",
                    edit: "/pages/edit/:id",
                    meta: {
                      label: "Strony",
                      canDelete: true,
                    },
                  },
                ]}
                options={{
                  syncWithLocation: true,
                  warnWhenUnsavedChanges: true,
                  projectId: "jomNlf-ACeUmC-Qgzlvl",
                }}
              >
                <Routes>
                  <Route
                    element={
                      <ThemedLayout
                        Header={() => <Header sticky />}
                        Sider={(props) => <ThemedSider {...props} fixed />}
                      >
                        <Outlet />
                      </ThemedLayout>
                    }
                  >
                    <Route
                      index
                      element={<NavigateToResource resource="admin/forms" />}
                    />
                    <Route path="/forms">
                      <Route index element={<FormList />} />
                      <Route path="create" element={<FormCreate />} />
                      <Route path="edit/:id" element={<FormEdit />} />
                    </Route>
                    <Route path="/pages">
                      <Route index element={<PageList />} />
                    </Route>
                    <Route path="*" element={<ErrorComponent />} />
                  </Route>
                  {/* Puck (editor i publiczny render) celowo poza ThemedLayout - potrzebuje pelnego ekranu / to widok koncowego usera, nie panelu admina */}
                  <Route path="/pages/edit/:id" element={<PageEditor />} />
                  <Route path="/p/:id" element={<PageRender />} />
                </Routes>

                <RefineKbar />
                <UnsavedChangesNotifier />
                <DocumentTitleHandler />
              </Refine>
              <DevtoolsPanel />
            </DevtoolsProvider>
          </AntdApp>
        </ColorModeContextProvider>
      </RefineKbarProvider>
    </BrowserRouter>
  );
}

export default App;
