import { DeleteButton, EditButton, List, useTable } from "@refinedev/antd";
import type { BaseRecord } from "@refinedev/core";
import { Space, Table, Typography } from "antd";
import React from "react";
import { WIDGET_BASE_URL } from "../../providers/constants";

export const FormList = () => {
  const { tableProps } = useTable({
    syncWithLocation: true,
  });

  return (
    <List title="Schematy formularzy (form.io)">
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="id" title="ID schematu" />
        <Table.Column dataIndex="componentCount" title="Liczba pol" />
        <Table.Column dataIndex="requiredCount" title="Pola wymagane" />
        <Table.Column
          title="Widget"
          dataIndex="widget"
          render={(_, record: BaseRecord) => (
            <Typography.Link
              href={`${WIDGET_BASE_URL}/widget/formio/${record.id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Zobacz formularz
            </Typography.Link>
          )}
        />
        <Table.Column
          title="Builder"
          dataIndex="builder"
          render={(_, record: BaseRecord) => (
            <Typography.Link
              href={`${WIDGET_BASE_URL}/admin/forms/${record.id}/builder`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Otwórz w builderze
            </Typography.Link>
          )}
        />
        <Table.Column
          title="Akcje"
          dataIndex="actions"
          render={(_, record: BaseRecord) => (
            <Space>
              <EditButton hideText size="small" recordItemId={record.id} />
              <DeleteButton hideText size="small" recordItemId={record.id} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
