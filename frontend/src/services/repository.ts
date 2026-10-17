import { createApiRepository } from "./apiRepository";
import { createLocalRepository } from "./localRepository";
export const dataMode =
  import.meta.env.VITE_DATA_MODE === "api" ? "api" : "demo";
export const repository =
  dataMode === "api"
    ? createApiRepository(
        import.meta.env.VITE_API_URL || "http://localhost:8080/api/v1",
      )
    : createLocalRepository({
        getItem: (key) => window.localStorage.getItem(key),
        setItem: (key, value) => window.localStorage.setItem(key, value),
      });
