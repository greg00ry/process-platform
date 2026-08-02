import { Edit, useForm } from "@refinedev/antd";
import { Form, Input } from "antd";
import React from "react";

export const FormEdit = () => {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item label="ID schematu" name="id">
          <Input disabled />
        </Form.Item>
        <Form.Item
          label="Komponenty (schemat form.io, JSON)"
          name="components"
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
