"use client"

import { DashboardCard } from "../../components/DashboardCard"
import { PageContainer } from "../../components/PageContainer"

export const StaffAppointments = () => {
  return (
    <PageContainer
      title="Appointments"
      description="Assist patients with scheduling adjustments and intake."
    >
      <DashboardCard title="Appointment queue">
        <p className="text-sm text-muted-foreground">
          Shared scheduling tools will populate this list when services are connected.
        </p>
      </DashboardCard>
    </PageContainer>
  )
}

export default StaffAppointments
