import { createFileRoute } from "@tanstack/react-router";
import { Ban } from "lucide-react";
import { ErrorPage } from "@/components/autovault/error-page";

export const Route = createFileRoute("/405")({
  head: () => ({
    meta: [{ title: "Method not allowed · AutoVault" }, { name: "robots", content: "noindex" }],
  }),
  component: () => (
    <ErrorPage
      code={405}
      icon={Ban}
      title="Method not allowed"
      description="This action isn't supported for that request."
    />
  ),
});
