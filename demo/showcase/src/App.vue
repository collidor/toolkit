<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import Navbar from "./components/Navbar.vue";
import Sidebar from "./components/Sidebar.vue";
import DocViewer from "./components/DocViewer.vue";
import PokedexDemo from "./components/PokedexDemo.vue";
import ArchitectureView from "./components/ArchitectureView.vue";
import DevToolsDock from "./components/DevToolsDock.vue";
import { busService } from "./services/busService";
import { ThemeChangedEvent } from "@demo/shared";

const currentTab = ref<"docs" | "demo" | "architecture">("docs");
const activeSectionId = ref("overview");

function onTabChange(tab: "docs" | "demo" | "architecture") {
  currentTab.value = tab;
  if (tab === "demo") {
    window.location.hash = "demo";
  } else if (tab === "architecture") {
    window.location.hash = "architecture";
  } else {
    window.location.hash = activeSectionId.value || "overview";
  }
}

function scrollToSection(id: string) {
  if (currentTab.value !== "docs") {
    currentTab.value = "docs";
  }

  activeSectionId.value = id;
  setTimeout(() => {
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  }, 50);
}

function handleScroll() {
  if (currentTab.value !== "docs") return;

  const sections = document.querySelectorAll("section[id]");
  const scrollY = window.scrollY + 120;

  for (let i = sections.length - 1; i >= 0; i--) {
    const el = sections[i] as HTMLElement;
    if (el.offsetTop <= scrollY) {
      activeSectionId.value = el.id;
      break;
    }
  }
}

function onThemeChange(theme: string) {
  busService.setTheme(theme);
  busService.logTelemetry("event", "ThemeChangedEvent", "Host/Shell", { theme });

  // Direct postMessage to any active iframes to guarantee instant synchronization
  document.querySelectorAll("iframe").forEach((f) => {
    try {
      f.contentWindow?.postMessage({ type: "COLLIDOR_SET_THEME", theme }, "*");
    } catch {
      // ignore
    }
  });
}

function syncHash() {
  const hash = window.location.hash.slice(1);
  if (hash === "demo" || hash === "pokedex") {
    currentTab.value = "demo";
  } else if (hash === "architecture" || hash === "ipc") {
    currentTab.value = "architecture";
  } else {
    currentTab.value = "docs";
    if (hash && hash !== "docs") {
      setTimeout(() => scrollToSection(hash), 100);
    }
  }
}

onMounted(() => {
  window.addEventListener("scroll", handleScroll, { passive: true });
  window.addEventListener("hashchange", syncHash);
  syncHash();
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
  window.removeEventListener("hashchange", syncHash);
});
</script>

<template>
  <div class="docs-layout">
    <Navbar :current-tab="currentTab" @tab-change="onTabChange" @theme-change="onThemeChange" />

    <!-- 1. Documentation View (with Sidebar & Standard Reading Width) -->
    <div v-show="currentTab === 'docs'" class="docs-body">
      <Sidebar :active-id="activeSectionId" @navigate="scrollToSection" />

      <main class="docs-main">
        <DocViewer @launch-demo="onTabChange('demo')" />
      </main>
    </div>

    <!-- 2. Full-Screen Pokédex Demo Page (No Sidebar, Maximum Width & Space) -->
    <div v-show="currentTab === 'demo'" class="demo-page">
      <PokedexDemo />
    </div>

    <!-- 3. Architecture & IPC Page -->
    <div v-show="currentTab === 'architecture'" class="arch-page-container">
      <ArchitectureView />
    </div>

    <DevToolsDock />
  </div>
</template>

<style scoped>
.docs-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.docs-body {
  display: flex;
  flex: 1;
  max-width: 1440px;
  width: 100%;
  margin: 0 auto;
}

.docs-main {
  flex: 1;
  min-width: 0;
}

.demo-page {
  flex: 1;
  width: 100%;
}

.arch-page-container {
  flex: 1;
  width: 100%;
}
</style>
