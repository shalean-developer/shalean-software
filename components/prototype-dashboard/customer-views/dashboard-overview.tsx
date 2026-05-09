"use client";

import { customerHasUpcomingBookings } from "../customer-dashboard-visibility";
import { DashboardOverviewEmpty } from "./dashboard-overview-empty";
import { DashboardOverviewOperational } from "./dashboard-overview-operational";

export function DashboardOverview() {
  if (!customerHasUpcomingBookings()) {
    return <DashboardOverviewEmpty />;
  }
  return <DashboardOverviewOperational />;
}
