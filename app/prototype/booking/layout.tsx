import { PrototypeScrollEnvironment } from "@/components/booking-prototype/prototype-scroll-environment";

export default function BookingPrototypeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PrototypeScrollEnvironment />
      {children}
    </>
  );
}
