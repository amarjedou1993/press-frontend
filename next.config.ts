import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  /*
   * ⚠️ "standalone" : NÉCESSAIRE À L'IMAGE DOCKER.
   *
   * Next.js produit alors dans .next/standalone un serveur autonome avec les
   * seules dépendances qu'il utilise. L'image livrée au MTNIMA ne contient que
   * lui, au lieu de tout node_modules — c'est ce qui la garde légère, comme le
   * demande le manuel de livraison. Sans cette ligne, l'image ne se construit
   * pas.
   *
   * Sans effet sur `npm run dev`.
   */
  output: "standalone",
};

export default withNextIntl(nextConfig);
