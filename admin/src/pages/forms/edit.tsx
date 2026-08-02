import { Edit, useForm } from "@refinedev/antd";
import { Button, Form, Input } from "antd";
import React from "react";
import { useParams } from "react-router";
import { WIDGET_BASE_URL } from "../../providers/constants";

export const FormEdit = () => {
  const { formProps, saveButtonProps } = useForm({});
  const { id } = useParams();

  return (
    <Edit
      saveButtonProps={saveButtonProps}
      headerButtons={({ defaultButtons }) => (
        <>
          <Button
            href={`${WIDGET_BASE_URL}/admin/forms/${id}/builder`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Otwórz w wizualnym builderze
          </Button>
          {defaultButtons}
        </>
      )}
    >
      <Form {...formProps} layout="vertical">
        <Form.Item label="ID schematu" name="id">
          <Input disabled />
        </Form.Item>
        <Form.Item
          label="Komponenty (schemat form.io, JSON)"
          name="components"
          extra="Do wygodniejszej edycji uzyj przycisku 'Otworz w wizualnym builderze' powyzej (drag & drop, hostowane przez htmx)."
          getValueProps={(value) => ({
            value: typeof value === "string" ? value : JSON.stringify(value ?? [], null, 2),
          })}
          normalize={(value) => {
            try {
              return JSON.parse(value);
            } catch {
              return value;
            }
          }}
          rules={[
            {
              validator: async (_, value) => {
                if (!Array.isArray(value)) {
                  throw new Error("Nieprawidlowy JSON — oczekiwana tablica komponentow form.io");
                }
              },
            },
          ]}
        >
          <Input.TextArea rows={20} style={{ fontFamily: "monospace" }} />
        </Form.Item>
      </Form>
    </Edit>
  );
};
