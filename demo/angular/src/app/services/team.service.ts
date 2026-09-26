import { Injectable, signal } from "@angular/core";
import { EventBus } from "@collidor/event";
import { AsyncCommandBus, PortChannelPlugin } from "@collidor/command";
import { Injector } from "@collidor/injector";
import {
  AddTeamMemberSchemaCommand,
  ClearTeamCommand,
  FocusViewEvent,
  GetTeamCommand,
  initializeIframePort,
  PokemonDetail,
  PokemonSelectedEvent,
  PokemonInspectedEvent,
  RemoveTeamMemberCommand,
  Team,
  TeamMember,
  TeamUpdatedEvent,
  ThemeChangedEvent,
} from "@demo/shared";

@Injectable({
  providedIn: "root",
})
export class TeamService {
  public portPlugin: PortChannelPlugin;
  public eventBus: EventBus;
  public commandBus: AsyncCommandBus<any, any>;
  public collidorInjector: Injector;

  public isConnected = signal<boolean>(false);
  public theme = signal<"dark" | "light">("dark");
  public team = signal<Team>({
    id: "initial-team",
    name: "Kanto Champions",
    members: [],
  });

  constructor() {
    // 1. Initialize local PortChannelPlugin
    this.portPlugin = new PortChannelPlugin({
      commandTimeout: 15000,
      ackTimeout: 5000,
      bufferTimeout: 10000,
    });

    // 2. Initialize local Buses
    this.eventBus = new EventBus({
      channel: this.portPlugin,
    });

    this.commandBus = new AsyncCommandBus({
      plugin: this.portPlugin,
    });

    // 3. Setup Collidor Injector
    this.collidorInjector = new Injector();
    this.collidorInjector.register(EventBus, this.eventBus);
    this.collidorInjector.register(AsyncCommandBus, this.commandBus);

    const applyTheme = (theme: "dark" | "light") => {
      this.theme.set(theme);
      if (typeof document !== "undefined") {
        document.documentElement.classList.toggle("light", theme === "light");
        document.documentElement.classList.toggle("dark", theme === "dark");
        if (document.body) {
          document.body.classList.toggle("light", theme === "light");
          document.body.classList.toggle("dark", theme === "dark");
          document.body.style.backgroundColor = theme === "light" ? "#f8fafc" : "#090d16";
          document.body.style.color = theme === "light" ? "#0f172a" : "#f8fafc";
        }
        const appRoot = document.querySelector("app-root") as HTMLElement | null;
        if (appRoot) {
          appRoot.classList.toggle("light", theme === "light");
          appRoot.classList.toggle("dark", theme === "dark");
          appRoot.style.backgroundColor = theme === "light" ? "#f8fafc" : "#090d16";
          appRoot.style.color = theme === "light" ? "#0f172a" : "#f8fafc";
        }
      }
    };

    // 4. Pre-register listeners
    this.eventBus.on(TeamUpdatedEvent, (update: any) => {
      this.team.set(update.team);
    });

    this.eventBus.on(ThemeChangedEvent, (event: any) => {
      applyTheme(event.theme);
    });

    if (typeof window !== "undefined") {
      window.addEventListener("message", (e: MessageEvent) => {
        if (e.data?.type === "COLLIDOR_SET_THEME") {
          applyTheme(e.data.theme);
        }
      });
      try {
        if (window.localStorage) {
          const saved = window.localStorage.getItem("collidor:theme") as "dark" | "light";
          if (saved === "light" || saved === "dark") {
            applyTheme(saved);
          }
        }
      } catch {
        // ignore
      }
    }

    // 5. Connect to Host via transferred MessagePort
    this.connectToHost();
  }

  private async connectToHost(): Promise<void> {
    try {
      await initializeIframePort(this.portPlugin);
      this.isConnected.set(true);

      // Fetch initial team from host
      try {
        if (typeof (this.commandBus as any).waitFor === "function") {
          await (this.commandBus as any).waitFor(GetTeamCommand, { timeout: 5000 });
        }
        const res = await this.commandBus.execute(new GetTeamCommand());
        if (res.success) {
          this.team.set(res.value);
        }
      } catch (err) {
        console.warn("Could not fetch initial team from host:", err);
      }
    } catch (err) {
      console.error("Angular iframe failed to connect to host:", err);
    }
  }

  public async addMember(pokemon: PokemonDetail, nickname?: string): Promise<{ success: boolean; message: string }> {
    try {
      const cmd = new AddTeamMemberSchemaCommand({
        pokemon,
        nickname,
        level: 50,
      });

      const res = await this.commandBus.execute(cmd);
      if (res.success) {
        this.team.set(res.team);
        return { success: true, message: `Added ${pokemon.name}!` };
      }
      return { success: false, message: res.message };
    } catch (err) {
      return { success: false, message: String(err) };
    }
  }

  public async removeMember(instanceId: string): Promise<void> {
    try {
      const res = await this.commandBus.execute(new RemoveTeamMemberCommand({ instanceId }));
      if (res.success) {
        this.team.set(res.value.team);
      }
    } catch (err) {
      console.error("Failed to remove member:", err);
    }
  }

  public async clearTeam(): Promise<void> {
    try {
      const res = await this.commandBus.execute(new ClearTeamCommand());
      if (res.success) {
        this.team.set(res.value.team);
      }
    } catch (err) {
      console.error("Failed to clear team:", err);
    }
  }

  public selectMember(member: TeamMember): void {
    this.eventBus.emit(new PokemonInspectedEvent(member.pokemon));
  }

  public deployToBattle(member: TeamMember): void {
    this.eventBus.emit(new PokemonSelectedEvent(member.pokemon));
    this.eventBus.emit(
      new FocusViewEvent({
        tab: "solid",
        reason: `Deploying ${member.nickname || member.pokemon.name} to Battle Arena`,
      })
    );
  }
}
