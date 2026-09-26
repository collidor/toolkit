import { Component, ChangeDetectionStrategy, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { TeamService } from "./services/team.service";
import { SEED_POKEMON_LIST, TeamMember } from "@demo/shared";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    "[class.light]": 'theme() === "light"',
  },
  template: `
    <div class="team-container" [class.light]="theme() === 'light'">
      <!-- Top Bar -->
      <div class="header-bar">
        <div>
          <h2 class="title">
            <span class="dot"></span>
            Angular 18 Team Builder (Analog)
          </h2>
          <p class="subtitle">Sandboxed Iframe &bull; Schema-Validated Commands</p>
        </div>
        <div class="status-badge" [class.connected]="isConnected()">
          {{ isConnected() ? '⚡ PortChannel Connected' : 'Waiting for Handshake...' }}
        </div>
      </div>

      <!-- Team Roster Header -->
      <div class="roster-header">
        <span class="party-count">
          Party: <strong>{{ team().members.length }}</strong> / 6 Pokémon
        </span>
        <div class="actions">
          <button (click)="quickAddStarter()" class="btn-sm btn-starter" [disabled]="team().members.length >= 6">
            + Quick Add
          </button>
          <button (click)="clearTeam()" class="btn-sm btn-clear" [disabled]="team().members.length === 0">
            Clear
          </button>
        </div>
      </div>

      <!-- Members Grid -->
      <div class="roster-grid">
        @for (member of team().members; track member.instanceId) {
          <div class="member-card">
            <div class="member-left" (click)="inspectMember(member)" title="Inspect this Pokémon in Svelte & Vue">
              <img [src]="member.pokemon.sprites.thumbnail" [alt]="member.pokemon.name" class="member-img" />
              <div>
                <div class="member-title">
                  <span class="name">{{ member.nickname || member.pokemon.name }}</span>
                  <span class="level">Lv. {{ member.level }}</span>
                </div>
                <div class="types-row">
                  @for (t of member.pokemon.types; track t) {
                    <span class="type-pill" [class]="'type-' + t">{{ t }}</span>
                  }
                </div>
              </div>
            </div>

            <div class="member-right">
              <button (click)="deployToBattle(member, $event)" class="btn-action-battle" title="Deploy to Solid Battle Arena">
                ⚔️ Arena
              </button>
              <button (click)="removeMember(member.instanceId, $event)" class="btn-remove" title="Remove member">
                &times;
              </button>
            </div>
          </div>
        } @empty {
          <div class="empty-state">
            <p>Your team is currently empty.</p>
            <p class="empty-hint">
              Select any Pokémon in the Vue catalog or Svelte inspector, then click <strong>"+ Add to Team"</strong>!
            </p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
      min-height: 100%;
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
      color: #f8fafc;
      background-color: #090d16;
      box-sizing: border-box;
      padding: 12px;
      overflow-y: auto;
      transition: background-color 0.2s, color 0.2s;
    }

    :host(.light),
    :host-context(html.light),
    :host-context(body.light) {
      background-color: #f8fafc !important;
      color: #0f172a !important;
    }

    .team-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-height: 100%;
    }

    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding-bottom: 8px;
    }

    .title {
      font-size: 13px;
      font-weight: 800;
      color: #f87171;
      display: flex;
      align-items: center;
      gap: 6px;
      margin: 0;
    }

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 9999px;
      background-color: #ef4444;
      display: inline-block;
    }

    .subtitle {
      font-size: 10px;
      color: #94a3b8;
      margin: 2px 0 0 0;
    }

    .status-badge {
      font-size: 10px;
      font-family: 'JetBrains Mono', monospace;
      padding: 2px 8px;
      border-radius: 6px;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #fca5a5;
    }

    .status-badge.connected {
      background: rgba(34, 197, 94, 0.1);
      border-color: rgba(34, 197, 94, 0.3);
      color: #86efac;
    }

    .roster-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      color: #94a3b8;
    }

    .actions {
      display: flex;
      gap: 6px;
    }

    .btn-sm {
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 10px;
      font-weight: 700;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 0.2s;
    }

    .btn-starter {
      background: rgba(239, 68, 68, 0.2);
      border-color: rgba(239, 68, 68, 0.4);
      color: #fca5a5;
    }
    .btn-starter:hover:not(:disabled) {
      background: rgba(239, 68, 68, 0.3);
    }

    .btn-clear {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.1);
      color: #94a3b8;
    }
    .btn-clear:hover:not(:disabled) {
      color: #f87171;
    }

    .btn-sm:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .roster-grid {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .member-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 10px;
      padding: 6px 10px;
      transition: border-color 0.2s;
    }
    .member-card:hover {
      border-color: rgba(239, 68, 68, 0.4);
    }

    .member-left {
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      flex: 1;
      padding: 2px 4px;
      border-radius: 6px;
      transition: background 0.15s;
    }
    .member-left:hover {
      background: rgba(255, 255, 255, 0.05);
    }

    .member-right {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .btn-action-battle {
      background: rgba(6, 182, 212, 0.15);
      border: 1px solid rgba(6, 182, 212, 0.35);
      color: #67e8f9;
      font-size: 10px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-action-battle:hover {
      background: rgba(6, 182, 212, 0.25);
      border-color: rgba(6, 182, 212, 0.6);
      color: #a5f3fc;
      transform: scale(1.03);
    }

    .member-img {
      width: 36px;
      height: 36px;
      object-fit: contain;
    }

    .member-title {
      display: flex;
      align-items: baseline;
      gap: 6px;
    }

    .name {
      font-size: 12px;
      font-weight: 700;
      text-transform: capitalize;
    }

    .level {
      font-size: 10px;
      font-family: 'JetBrains Mono', monospace;
      color: #94a3b8;
    }

    .types-row {
      display: flex;
      gap: 4px;
      margin-top: 2px;
    }

    .type-pill {
      font-size: 9px;
      font-weight: 600;
      text-transform: uppercase;
      padding: 1px 5px;
      border-radius: 4px;
    }

    .type-grass { background: rgba(34, 197, 94, 0.2); color: #4ade80; }
    .type-fire { background: rgba(239, 68, 68, 0.2); color: #f87171; }
    .type-water { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }
    .type-electric { background: rgba(234, 179, 8, 0.2); color: #facc15; }
    .type-poison { background: rgba(168, 85, 247, 0.2); color: #c084fc; }
    .type-ghost { background: rgba(99, 102, 241, 0.2); color: #818cf8; }
    .type-normal { background: rgba(148, 163, 184, 0.2); color: #cbd5e1; }
    .type-dragon { background: rgba(79, 70, 229, 0.2); color: #a5b4fc; }

    .btn-remove {
      background: transparent;
      border: none;
      color: #64748b;
      font-size: 16px;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      transition: color 0.2s;
    }
    .btn-remove:hover {
      color: #ef4444;
      background: rgba(239, 68, 68, 0.1);
    }

    .empty-state {
      text-align: center;
      padding: 24px 12px;
      border: 1px dashed rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      color: #64748b;
      font-size: 11px;
    }
    .empty-hint {
      margin-top: 6px;
      font-size: 10px;
      color: #94a3b8;
    }

    /* Light Theme Direct & Context Rules */
    .team-container.light,
    :host-context(html.light) .team-container {
      background: transparent !important;
      color: #0f172a;
    }
    .team-container.light .member-card,
    :host-context(html.light) .member-card {
      background: #ffffff !important;
      border: 1px solid #e2e8f0 !important;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04) !important;
    }
    .team-container.light .name,
    :host-context(html.light) .name {
      color: #0f172a !important;
    }
    .team-container.light .subtitle,
    :host-context(html.light) .subtitle {
      color: #475569 !important;
    }
    .team-container.light .title,
    :host-context(html.light) .title {
      color: #b91c1c !important;
    }
    .team-container.light .party-count,
    :host-context(html.light) .party-count {
      color: #1e293b !important;
    }
    .team-container.light .level,
    :host-context(html.light) .level {
      color: #475569 !important;
    }
    .team-container.light .stat-box,
    :host-context(html.light) .stat-box {
      background: #f1f5f9 !important;
      border: 1px solid #e2e8f0 !important;
    }
    .team-container.light .stat-label,
    :host-context(html.light) .stat-label {
      color: #64748b !important;
    }
    .team-container.light .stat-val,
    :host-context(html.light) .stat-val {
      color: #0f172a !important;
    }
    .team-container.light .empty-state,
    :host-context(html.light) .empty-state {
      background: #ffffff !important;
      border: 1px dashed #cbd5e1 !important;
      color: #64748b !important;
    }
    .team-container.light .empty-hint,
    :host-context(html.light) .empty-hint {
      color: #475569 !important;
    }
    .team-container.light .member-img,
    :host-context(html.light) .member-img {
      background: #f1f5f9 !important;
      border: 1px solid #e2e8f0 !important;
    }
    .team-container.light .btn-arena,
    :host-context(html.light) .btn-arena {
      background: #e0f2fe !important;
      border: 1px solid #7dd3fc !important;
      color: #0369a1 !important;
      font-weight: 700 !important;
    }
    .team-container.light .btn-arena:hover,
    :host-context(html.light) .btn-arena:hover {
      background: #bae6fd !important;
    }
    .team-container.light .btn-starter,
    :host-context(html.light) .btn-starter {
      background: #fee2e2 !important;
      border: 1px solid #fca5a5 !important;
      color: #991b1b !important;
      font-weight: 700 !important;
    }
    .team-container.light .status-badge,
    :host-context(html.light) .status-badge {
      background: #f1f5f9 !important;
      border: 1px solid #cbd5e1 !important;
      color: #475569 !important;
    }
    .team-container.light .status-badge.connected,
    :host-context(html.light) .status-badge.connected {
      background: #dcfce7 !important;
      border: 1px solid #86efac !important;
      color: #166534 !important;
      font-weight: 700 !important;
    }
    .team-container.light .btn-clear,
    :host-context(html.light) .btn-clear {
      background: #f1f5f9 !important;
      border: 1px solid #cbd5e1 !important;
      color: #475569 !important;
    }
  `],
})
export class AppComponent {
  private readonly teamService = inject(TeamService);

  readonly team = this.teamService.team;
  readonly isConnected = this.teamService.isConnected;
  readonly theme = this.teamService.theme;

  inspectMember(member: TeamMember) {
    this.teamService.selectMember(member);
  }

  deployToBattle(member: TeamMember, event: MouseEvent) {
    event.stopPropagation();
    this.teamService.deployToBattle(member);
  }

  removeMember(instanceId: string, event?: MouseEvent) {
    event?.stopPropagation();
    this.teamService.removeMember(instanceId);
  }

  clearTeam() {
    this.teamService.clearTeam();
  }

  quickAddStarter() {
    const starter = SEED_POKEMON_LIST[Math.floor(Math.random() * SEED_POKEMON_LIST.length)];
    this.teamService.addMember(starter);
  }
}
