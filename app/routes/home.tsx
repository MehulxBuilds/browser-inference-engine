import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Browser LLM" },
    { name: "description", content: "Private, local AI chat powered by language models running in your browser." },
  ];
}

export default function Home() {
  return <Welcome />;
}
