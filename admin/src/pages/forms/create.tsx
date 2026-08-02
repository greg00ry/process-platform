import { Create, useForm } from "@refinedev/antd";
import { Form, Input } from "antd";
import React from "react";

const DEFAULT_COMPONENTS = [
  {
    key: "example",
    type: "textfield",
    label: "Przyklad",
    validate: { required: true },
  },
];

export const FormCreate = () => {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item
          label="ID schematu"
          name="id"
          extra="Staje sie czescia URL widgetu: /widget/formio/:id"
          rules={[
            { required: true, message: "ID jest wymagane" },
            {
              pattern: /^[a-z0-9-]+$/,
              message: "Tylko male litery, cyfry i myslniki",
            },
          ]}
        >
          <Input placeholder="np. wniosek-o-urlop" />
        </Form.Item>
        <Form.Item
          label="Komponenty (schemat form.io, JSON)"
          name="components"
          initialValue={DEFAULT_COMPONENTS}
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
    </Create>
  );
};
