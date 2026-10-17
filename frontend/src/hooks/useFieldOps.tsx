import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Repository, Snapshot } from "../types";
import { repository } from "../services/repository";
import { errorMessage } from "../services/validation";
interface DataContext {
  snapshot: Snapshot;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  execute: <T>(action: (repo: Repository) => Promise<T>) => Promise<T>;
}
const Context = createContext<DataContext | null>(null);
export function FieldOpsProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<Snapshot>({
    orders: [],
    technicians: [],
    activities: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setSnapshot(await repository.load());
      setError(null);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void refresh();
    const onStorage = (event: StorageEvent) => {
      if (event.key === "fieldops.demo.v1") void refresh();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refresh]);
  const execute = useCallback(
    async <T,>(action: (repo: Repository) => Promise<T>): Promise<T> => {
      const result = await action(repository);
      try {
        setSnapshot(await repository.load());
        setError(null);
      } catch (err) {
        setError(
          `A operação foi registrada, mas houve um problema ao atualizar a tela. ${errorMessage(err)}`,
        );
      }
      return result;
    },
    [],
  );
  return (
    <Context.Provider value={{ snapshot, loading, error, refresh, execute }}>
      {children}
    </Context.Provider>
  );
}
export function useFieldOps() {
  const context = useContext(Context);
  if (!context) throw new Error("FieldOpsProvider ausente.");
  return context;
}
