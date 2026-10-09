import { createApp } from "vue";
import App from "./App.vue";

// Import Collidor UI Styles & Themes
import "@collidor/ui/dist/ui.css";
import "@collidor/ui/themes/jewel-artnouveau.css";
import "@collidor/ui/themes/neumorphic.css";
import "@collidor/ui/themes/rpg-parchment.css";
import "@collidor/ui/themes/troy-strategy.css";

// Import Collidor UI Custom Elements
import "@collidor/ui";

// Import Site Styles
import "./style.css";

const app = createApp(App);
app.mount("#app");
