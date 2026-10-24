from typing import List, Dict, Optional
from backend.app.schemas.trip import SeatMapItem, SeatMapResponse, PassengerResponse

class SeatLayoutService:
    @staticmethod
    def generate_seat_map(
        trip_id: str,
        layout_type: str = "2x2_seater",
        passengers: List[PassengerResponse] = None
    ) -> SeatMapResponse:
        passengers = passengers or []
        # Index passengers by uppercase seat number
        passenger_by_seat: Dict[str, PassengerResponse] = {}
        for p in passengers:
            if p.seat_number:
                passenger_by_seat[p.seat_number.strip().upper()] = p

        items: List[SeatMapItem] = []

        if layout_type == "2x1_sleeper":
            rows = 8
            cols = 4
            # Column 0: Single berth (S1..S8)
            # Column 1: Aisle
            # Column 2: Double berth A (D1A..D8A)
            # Column 3: Double berth B (D1B..D8B)
            for r in range(1, rows + 1):
                # Seat 1: Left
                s1_num = f"L{r}"
                p1 = passenger_by_seat.get(s1_num.upper())
                items.append(SeatMapItem(
                    seat_number=s1_num,
                    row=r,
                    column=0,
                    tier="lower",
                    status=p1.current_status if p1 else "unassigned",
                    passenger=p1
                ))

                # Aisle
                items.append(SeatMapItem(
                    seat_number="",
                    row=r,
                    column=1,
                    is_aisle=True,
                    status="unassigned"
                ))

                # Seat 2: Right inner
                s2_num = f"R{r}A"
                p2 = passenger_by_seat.get(s2_num.upper())
                items.append(SeatMapItem(
                    seat_number=s2_num,
                    row=r,
                    column=2,
                    tier="lower",
                    status=p2.current_status if p2 else "unassigned",
                    passenger=p2
                ))

                # Seat 3: Right outer
                s3_num = f"R{r}B"
                p3 = passenger_by_seat.get(s3_num.upper())
                items.append(SeatMapItem(
                    seat_number=s3_num,
                    row=r,
                    column=3,
                    tier="lower",
                    status=p3.current_status if p3 else "unassigned",
                    passenger=p3
                ))
            total_seats = rows * 3

        else:
            # Standard 2x2 Seater (40 seats, 10 rows)
            rows = 10
            cols = 5
            # Columns: 0(A), 1(B), 2(Aisle), 3(C), 4(D)
            col_letters = {0: "A", 1: "B", 3: "C", 4: "D"}
            for r in range(1, rows + 1):
                for c in range(cols):
                    if c == 2:
                        items.append(SeatMapItem(
                            seat_number="",
                            row=r,
                            column=c,
                            is_aisle=True,
                            status="unassigned"
                        ))
                    else:
                        letter = col_letters[c]
                        seat_num = f"{r}{letter}"
                        # Also check alternate naming like e.g. "1" or "2" if simple numbers
                        p = passenger_by_seat.get(seat_num.upper())
                        if not p:
                            # Try just number format
                            flat_index = (r - 1) * 4 + (c if c < 2 else c - 1) + 1
                            p = passenger_by_seat.get(str(flat_index))

                        status = p.current_status if p else "unassigned"
                        items.append(SeatMapItem(
                            seat_number=seat_num,
                            row=r,
                            column=c,
                            tier="lower",
                            status=status,
                            passenger=p
                        ))
            total_seats = 40

        return SeatMapResponse(
            trip_id=trip_id,
            layout_type=layout_type,
            total_seats=total_seats,
            rows=rows,
            columns=cols,
            seats=items
        )
