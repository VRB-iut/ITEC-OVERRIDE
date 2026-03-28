import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Schimbă aici: pune direct string-ul
    url: "file:./dev.db",
  },
});
