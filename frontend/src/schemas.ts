import { z } from "zod";

export const PlayerSchema = z.union([z.literal(1), z.literal(2)]);
const CellSchema = z.union([z.literal(0), PlayerSchema]);
const DateSchema = z.iso.datetime({ offset: true });
export const UserSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(80),
  created_at: DateSchema,
});
const PositionSchema = z.object({
  row: z.number().int().min(0).max(5),
  column: z.number().int().min(0).max(6),
});
const MoveSchema = PositionSchema.extend({
  number: z.number().int().min(1).max(42),
  player: PlayerSchema,
  created_at: DateSchema,
});
export const GameSummarySchema = z.object({
  id: z.uuid(),
  user_id: z.uuid(),
  board: z.array(z.array(CellSchema).length(7)).length(6),
  state: z.enum(["not_started", "in_progress", "complete", "draw"]),
  next_player: PlayerSchema.nullable(),
  winner: PlayerSchema.nullable(),
  winning_cells: z.array(PositionSchema),
  version: z.number().int().min(0).max(42),
  created_at: DateSchema,
  updated_at: DateSchema,
});
export const GameSchema = GameSummarySchema.extend({
  moves: z.array(MoveSchema).max(42),
});
export const SignInSchema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(80),
});
export const SubmitMoveSchema = z.object({
  column: z.number().int().min(0).max(6),
  expected_version: z.number().int().min(0).max(42),
  player: PlayerSchema.optional(),
});

export type Player = z.infer<typeof PlayerSchema>;
export type Cell = z.infer<typeof CellSchema>;
export type User = z.infer<typeof UserSchema>;
export type Position = z.infer<typeof PositionSchema>;
export type Move = z.infer<typeof MoveSchema>;
export type GameSummary = z.infer<typeof GameSummarySchema>;
export type Game = z.infer<typeof GameSchema>;
export type GameState = Game["state"];
