import PokemonInspector from "./PokemonInspector.svelte";

export function mountSvelteInspector(container: HTMLElement, busService: any): () => void {
  // Svelte 4 component instantiation
  const component = new PokemonInspector({
    target: container,
    props: {
      busService,
    },
  });

  return () => {
    component.$destroy();
  };
}
