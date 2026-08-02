import { Puck, type Data } from "@measured/puck";
import "@measured/puck/puck.css";
import { useOne, useUpdate } from "@refinedev/core";
import React from "react";
import { useNavigate, useParams } from "react-router";
import { config } from "../../puck/config";

const emptyData = (id: string): Data => ({
  content: [],
  root: { props: { title: id } },
});

export const PageEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { result, query } = useOne({
    resource: "admin/pages",
    id,
    errorNotification: false,
    queryOptions: { retry: false },
  });
  const { mutate } = useUpdate();

  if (query.isLoading) return null;

  const initialData = (result as Data | undefined) ?? emptyData(id!);

  return (
    <Puck
      config={config}
      data={initialData}
      onPublish={(data: Data) => {
        mutate(
          {
            resource: "admin/pages",
            id: id!,
            values: data,
            successNotification: () => ({
              message: "Strona zapisana",
              type: "success",
            }),
          },
          { onSuccess: () => navigate("/pages") }
        );
      }}
      overrides={{
        headerActions: ({ children }) => (
          <>
            <button
              type="button"
              onClick={() => navigate("/pages")}
              style={{ marginRight: 8 }}
            >
              Wroc do listy
            </button>
            {children}
          </>
        ),
      }}
    />
  );
};
