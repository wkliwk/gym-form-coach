import React from "react";
import { render } from "@testing-library/react-native";
import StreakWidget from "../components/StreakWidget";

describe("StreakWidget", () => {
  it("shows motivation text when streak is 0", () => {
    const { getByText } = render(<StreakWidget current={0} best={0} />);
    expect(getByText("Start your streak today")).toBeTruthy();
  });

  it("shows current streak count and label", () => {
    const { getByText } = render(<StreakWidget current={5} best={10} />);
    expect(getByText("5")).toBeTruthy();
    expect(getByText("days streak")).toBeTruthy();
  });

  it("shows singular 'day' for streak of 1", () => {
    const { getByText } = render(<StreakWidget current={1} best={3} />);
    expect(getByText("1")).toBeTruthy();
    expect(getByText("day streak")).toBeTruthy();
  });

  it("shows best streak when > 0", () => {
    const { getByText } = render(<StreakWidget current={3} best={7} />);
    expect(getByText("Best")).toBeTruthy();
    expect(getByText("7")).toBeTruthy();
  });

  it("hides best streak section when best is 0", () => {
    const { queryByText } = render(<StreakWidget current={0} best={0} />);
    expect(queryByText("Best")).toBeNull();
  });

  it("shows fire emoji for active streak", () => {
    const { getByText } = render(<StreakWidget current={3} best={5} />);
    expect(getByText("🔥")).toBeTruthy();
  });

  it("shows sleep emoji for no streak", () => {
    const { getByText } = render(<StreakWidget current={0} best={5} />);
    expect(getByText("💤")).toBeTruthy();
  });
});
