import "./globals.css";
import Header from "../components/Header";

export const metadata = {
  title: "MyShop",
  description: "Online Shopping Application",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Header />

        {children}
      </body>
    </html>
  );
}
