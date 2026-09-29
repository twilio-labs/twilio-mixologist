import { describe, test, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import ClearedAgo from "@/app/(master-layout)/event/[slug]/stats/clearedAgo";

afterEach(cleanup);

describe("ClearedAgo", () => {
  test("renders a relative time with suffix for a recent timestamp", () => {
    const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
    const { container } = render(<ClearedAgo timestamp={oneMinuteAgo} />);
    expect(container.textContent).toMatch(/ago$/);
  });
});
