import { assertExists } from "@std/assert";

Deno.test("collidor toolkit package", async (t) => {
  await t.step("should import all sub-packages individually", async () => {
    const command = await import("./command.ts");
    const event = await import("./event.ts");
    const injector = await import("./injector.ts");
    const obsCommand = await import("./observable-command.ts");
    const obsEvent = await import("./observable-event.ts");
    const result = await import("./result.ts");
    const schemaCommand = await import("./schema-command.ts");

    assertExists(command.Command);
    assertExists(command.CommandBus);
    assertExists(event.EventBus);
    assertExists(injector.Injector);
    assertExists(obsCommand.ObservableCommandBus);
    assertExists(obsEvent.ObservableEventBus);
    assertExists(result.Result);
    assertExists(schemaCommand.SchemaCommand);
  });

  await t.step("should import all exports from main.ts", async () => {
    const main = await import("./main.ts");

    assertExists(main.Command);
    assertExists(main.CommandBus);
    assertExists(main.EventBus);
    assertExists(main.Injector);
    assertExists(main.ObservableCommandBus);
    assertExists(main.ObservableEventBus);
    assertExists(main.Result);
    assertExists(main.SchemaCommand);
  });
});
