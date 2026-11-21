/**
 * Lumen's customers, as Adminium is told of them (ACC-10).
 *
 * `customers` is the one people table. `review_requests` is the `surveys`
 * consent, kept in step with the consent log (cQ10). A customer is copied
 * onto each booking (the name, e-mail and phone as typed), onto a waiting-list
 * row and onto a purchase. Each copy is declared, so finding, exporting and
 * erasing a person reaches it.
 *
 * Purchases and payments are the studio's record of a sale, which tax law
 * keeps (`keep` on their tables): an erasure leaves them, with their copies,
 * and lists them under "What stays". A booking is not: erasing a person blanks
 * its typed name, e-mail, phone and notes. The public "Delete my details"
 * empties the customer's own row and stops their links; the app's own rule
 * (T13, cQ29) then cancels the visits ahead, closes their waiting-list rows
 * and blanks those same copies.
 */
export const PEOPLE = [
  {
    table: "customers",
    kind: "people",
    email: "email",
    name: "name",
    firstName: "firstWordOfName",
    language: "language",
    consent: { column: "review_requests", purpose: "surveys" },
    copies: [
      { table: "bookings", column: "name", holds: "name", via: "customer_id" },
      { table: "bookings", column: "email", holds: "email", via: "customer_id" },
      { table: "bookings", column: "phone", holds: "phone", via: "customer_id" },
      { table: "bookings", column: "note", holds: "details", via: "customer_id" },
      { table: "bookings", column: "staff_note", holds: "details", via: "customer_id" },
      { table: "waitlist", column: "name", holds: "name", via: "customer_id" },
      { table: "waitlist", column: "email", holds: "email", via: "customer_id" },
      { table: "purchases", column: "buyer_name", holds: "name", via: "customer_id" },
      { table: "purchases", column: "buyer_email", holds: "email", via: "customer_id" },
      { table: "messages", column: "to_address", holds: "email", via: "customer_id" },
    ],
  },
];
