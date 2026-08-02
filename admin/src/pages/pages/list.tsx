import { DeleteButton, List, useTable } from "@refinedev/antd";
import type { BaseRecord } from "@refinedev/core";
import { Button, Input, Modal, Space, Table, Typography } from "antd";
import React, { useState } from "react";
import { useNavigate } from "react-router";

const ID_PATTERN = /^[a-z0-9-]+$/;

export const PageList = () => {
  const { tableProps } = useTable({ syncWithLocation: true });
  const navigate = useNavigate();
  const [newId, setNewId] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState("");

  const createAndOpen = () => {
    if (!ID_PATTERN.test(newId)) {
      setError("Tylko male litery, cyfry i myslniki.");
      return;
    }
    setModalOpen(false);
    setNewId("");
    setError("");
    navigate(`/pages/edit/${newId}`);
  };

  return (
    <List
      title="Strony (page builder)"
      headerButtons={() => (
        <Button type="primary" onClick={() => setModalOpen(true)}>
          Nowa strona
        </Button>
      )}
    >
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="id" title="ID strony" />
        <Table.Column dataIndex="blockCount" title="Liczba blokow" />
        <Table.Column
          title="Akcje"
          dataIndex="actions"
          render={(_, record: BaseRecord) => (
            <Space>
              <Button size="small" onClick={() => navigate(`/pages/edit/${record.id}`)}>
                Edytuj
              </Button>
              <Typography.Link href={`/p/${record.id}`} target="_blank" rel="noopener noreferrer">
                Podglad
              </Typography.Link>
              <DeleteButton hideText size="small" recordItemId={record.id} resource="admin/pages" />
            </Space>
          )}
        />
      </Table>

      <Modal
        title="Nowa strona"
        open={modalOpen}
        onOk={createAndOpen}
        onCancel={() => {
          setModalOpen(false);
          setError("");
        }}
        okText="Otworz w builderze"
      >
        <Input
          placeholder="np. strona-glowna"
          value={newId}
          onChange={(e) => setNewId(e.target.value)}
          onPressEnter={createAndOpen}
        />
        {error && <div style={{ color: "#ff4d4f", marginTop: 8 }}>{error}</div>}
      </Modal>
    </List>
  );
};
