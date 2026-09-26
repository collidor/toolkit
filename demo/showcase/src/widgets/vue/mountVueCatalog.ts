import { createApp } from "vue";
import PokemonCatalog from "./PokemonCatalog.vue";

export function mountVueCatalog(container: HTMLElement, busService: any): () => void {
  const app = createApp(PokemonCatalog, { busService });
  app.mount(container);

  return () => {
    app.unmount();
  };
}
