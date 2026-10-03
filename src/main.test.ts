import { assertExists } from "@std/assert";

Deno.test("collidor toolkit modular entrypoints", async (t) => {
  await t.step("should export complete command module API", async () => {
    const command = await import("./command.ts");
    assertExists(command.Command);
    assertExists(command.CommandBus);
    assertExists(command.AsyncCommandBus);
    assertExists(command.createCommand);
    assertExists(command.PortChannelPlugin);
  });

  await t.step("should export complete event module API", async () => {
    const event = await import("./event.ts");
    assertExists(event.Event);
    assertExists(event.EventBus);
    assertExists(event.createEvent);
    assertExists(event.PortChannel);
  });

  await t.step("should export complete injector module API", async () => {
    const injector = await import("./injector.ts");
    assertExists(injector.Injector);
  });

  await t.step("should export complete observable-command module API", async () => {
    const obsCommand = await import("./observable-command.ts");
    assertExists(obsCommand.ObservableCommandBus);
  });

  await t.step("should export complete observable-event module API", async () => {
    const obsEvent = await import("./observable-event.ts");
    assertExists(obsEvent.ObservableEventBus);
  });

  await t.step("should export complete result module API", async () => {
    const result = await import("./result.ts");
    assertExists(result.Result);
  });

  await t.step("should export complete schema-command module API", async () => {
    const schemaCommand = await import("./schema-command.ts");
    assertExists(schemaCommand.SchemaCommand);
    assertExists(schemaCommand.schemaCommand);
    assertExists(schemaCommand.createSchemaCommand);
  });
});
