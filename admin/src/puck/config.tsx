import type { Config, Slot } from "@measured/puck";
import React from "react";
import { WIDGET_BASE_URL } from "../providers/constants";

type Props = {
  HeadingBlock: { text: string; level: "h1" | "h2" | "h3" };
  TextBlock: { text: string };
  ImageBlock: { src: string; alt: string };
  ButtonBlock: { label: string; href: string };
  Section: { content?: Slot; padded: boolean };
  Columns: { left?: Slot; right?: Slot };
  Spacer: { height: number };
  Card: { title: string; content?: Slot };
  FormWidget: { schemaId: string };
};

type RootProps = { title: string };

export const config: Config<Props, RootProps> = {
  root: {
    fields: {
      title: { type: "text" },
    },
    defaultProps: { title: "Nowa strona" },
    render: ({ title, children }) => (
      <>
        <title>{title}</title>
        {children}
      </>
    ),
  },
  components: {
    HeadingBlock: {
      fields: {
        text: { type: "text" },
        level: {
          type: "select",
          options: [
            { label: "H1", value: "h1" },
            { label: "H2", value: "h2" },
            { label: "H3", value: "h3" },
          ],
        },
      },
      defaultProps: { text: "Naglowek", level: "h2" },
      render: ({ text, level }) => {
        const Tag = level;
        return <Tag>{text}</Tag>;
      },
    },
    TextBlock: {
      fields: { text: { type: "textarea" } },
      defaultProps: { text: "Tresc akapitu." },
      render: ({ text }) => <p style={{ lineHeight: 1.6 }}>{text}</p>,
    },
    ImageBlock: {
      fields: { src: { type: "text" }, alt: { type: "text" } },
      defaultProps: { src: "", alt: "" },
      render: ({ src, alt }) =>
        src ? (
          <img src={src} alt={alt} style={{ maxWidth: "100%", display: "block" }} />
        ) : (
          <div style={{ padding: 24, background: "#f0f0f0", textAlign: "center", color: "#888" }}>
            Brak obrazka — uzupelnij pole "src"
          </div>
        ),
    },
    ButtonBlock: {
      fields: { label: { type: "text" }, href: { type: "text" } },
      defaultProps: { label: "Kliknij", href: "#" },
      render: ({ label, href }) => (
        <a
          href={href}
          style={{
            display: "inline-block",
            padding: "0.6rem 1.4rem",
            background: "#1677ff",
            color: "#fff",
            borderRadius: 6,
            textDecoration: "none",
          }}
        >
          {label}
        </a>
      ),
    },
    Section: {
      fields: {
        content: { type: "slot" },
        padded: { type: "radio", options: [{ label: "Tak", value: true }, { label: "Nie", value: false }] },
      },
      defaultProps: { padded: true },
      render: ({ content: Content, padded }) => (
        <section style={{ padding: padded ? "2rem 1.5rem" : 0 }}>
          {Content && <Content />}
        </section>
      ),
    },
    Columns: {
      fields: { left: { type: "slot" }, right: { type: "slot" } },
      render: ({ left: Left, right: Right }) => (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          {Left && <Left />}
          {Right && <Right />}
        </div>
      ),
    },
    Spacer: {
      fields: { height: { type: "number" } },
      defaultProps: { height: 32 },
      render: ({ height }) => <div style={{ height }} />,
    },
    Card: {
      fields: { title: { type: "text" }, content: { type: "slot" } },
      defaultProps: { title: "Tytul karty" },
      render: ({ title, content: Content }) => (
        <div style={{ border: "1px solid #e0e0e0", borderRadius: 8, padding: "1.25rem" }}>
          <h3 style={{ marginTop: 0 }}>{title}</h3>
          {Content && <Content />}
        </div>
      ),
    },
    FormWidget: {
      fields: { schemaId: { type: "text" } },
      defaultProps: { schemaId: "document-intake" },
      render: ({ schemaId }) =>
        schemaId ? (
          <iframe
            title={`form-${schemaId}`}
            src={`${WIDGET_BASE_URL}/widget/formio/${schemaId}`}
            style={{ width: "100%", minHeight: 480, border: "none" }}
          />
        ) : (
          <div style={{ padding: 24, background: "#fff7e6", color: "#874d00" }}>
            Uzupelnij "schemaId" (patrz lista w Formularze) zeby osadzic widget.
          </div>
        ),
    },
  },
};
