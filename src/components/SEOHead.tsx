import { useEffect } from "react";

interface SEOHeadProps {
  title?: string;
  description?: string;
  path?: string;
}

const BASE_TITLE = "CareKaro";

export const SEOHead = ({ title, description, path }: SEOHeadProps) => {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${BASE_TITLE}` : `${BASE_TITLE} — AI-Powered Health Report Analysis`;
    document.title = fullTitle;

    if (description) {
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute("content", description);
    }

    if (path) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (link) link.href = `https://carekaro.app${path}`;
    }
  }, [title, description, path]);

  return null;
};
