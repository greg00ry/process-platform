import { Render, type Data } from "@measured/puck";
import { useOne } from "@refinedev/core";
import React from "react";
import { useParams } from "react-router";
import { config } from "../../puck/config";

export const PageRender = () => {
  const { id } = useParams();
  const { result, query } = useOne({
    resource: "admin/pages",
    id,
    errorNotification: false,
    queryOptions: { retry: false },
  });

  if (query.isLoading) return null;

  // To jest widok koncowego usera, wiec resetujemy kolory - inaczej dziedziczy
  // ciemny motyw panelu admina (Puck's <Puck> edytor izoluje canvas w iframe,
  // ale <Render> nie, wiec bez tego tlo/tekst panelu przecieka tutaj).
  return (
    <div style={{ minHeight: "100vh", background: "#fff", color: "#000" }}>
      {query.isError || !result ? (
        <div style={{ padding: 48, textAlign: "center" }}>Nie znaleziono strony.</div>
      ) : (
        <Render config={config} data={result as Data} />
      )}
    </div>
  );
};
