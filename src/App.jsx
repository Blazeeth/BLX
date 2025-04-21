import React, { useState, useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useBalance, useReadContract, useWriteContract } from "wagmi";
import MoneyTransferABI from './abi/MoneyTransferABI.json';
import "./index.css";
import { ExternalLink, Send, Menu, X, Github } from "lucide-react";
import { parseEther, formatEther } from "viem";

const CONTRACT_ADDRESS = "0x350ddFb12A1560ceA27E39aA7dc153138197bA18";

function App() {
  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });

  // Wagmi hooks
  const { address: account, isConnected } = useAccount();
  const { data: balanceData } = useBalance({ address: account, chainId: 11155111 }); // Sepolia chainId
  const { data: transactions, refetch: refetchTransactions } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: MoneyTransferABI,
    functionName: "getTransactions",
    enabled: isConnected,
  });
  const { writeContract, isPending, isSuccess, error } = useWriteContract();

  // Format balance
  const balance = balanceData ? balanceData.formatted : "0";

  // Send ETH via contract
  const sendMoney = async () => {
    if (!receiver || !amount) {
      alert("Please fill in all fields!");
      return;
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(receiver)) {
      alert("Invalid receiver address!");
      return;
    }

    setLoading(true);
    const notification = document.getElementById("notification");
    try {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: MoneyTransferABI,
        functionName: "transfer",
        args: [receiver],
        value: parseEther(amount),
      });
    } catch (err) {
      alert(`Error: ${err.message}`);
      notification.textContent = "Transaction failed";
      notification.classList.add("show", "error");
      setTimeout(() => notification.classList.remove("show", "error"), 3000);
      setLoading(false);
    }
  };

  // Handle transaction status
  useEffect(() => {
    const notification = document.getElementById("notification");
    if (isPending) {
      notification.textContent = "Transaction pending...";
      notification.classList.add("show");
    } else if (isSuccess) {
      notification.textContent = "Transaction successful!";
      setTimeout(() => notification.classList.remove("show"), 3000);
      refetchTransactions();
      setReceiver("");
      setAmount("");
      setLoading(false);
    } else if (error) {
      notification.textContent = "Transaction failed";
      notification.classList.add("show", "error");
      setTimeout(() => notification.classList.remove("show", "error"), 3000);
      setLoading(false);
    }
  }, [isPending, isSuccess, error, refetchTransactions]);

  const handleContactSubmit = (e) => {
    e.preventDefault();
    const notification = document.getElementById("notification");
    notification.textContent = "Message sent successfully!";
    notification.classList.add("show");
    setTimeout(() => notification.classList.remove("show"), 3000);
    setContactForm({ name: "", email: "", message: "" });
  };

  const handleContactChange = (e) => {
    setContactForm({ ...contactForm, [e.target.name]: e.target.value });
  };

  const scrollToSection = (sectionId) => {
    document.getElementById(sectionId).scrollIntoView({ behavior: "smooth" });
    setMobileMenuOpen(false);
  };

  return (
    <div className="app-container">
      {/* Notification */}
      <div id="notification" className="notification"></div>

      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-container">
          <div className="brand">BLX</div>

          {/* Mobile menu button */}
          <div className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </div>

          {/* Navigation links */}
          <ul className={`nav-links ${mobileMenuOpen ? "mobile-open" : ""}`}>
            <li onClick={() => scrollToSection("home")}>Home</li>
            <li onClick={() => scrollToSection("transactions")}>Transactions</li>
            <li onClick={() => scrollToSection("about")}>About</li>
            <li onClick={() => scrollToSection("contact")}>Contact</li>
          </ul>

          {/* Wallet connection */}
          <div className="wallet-container">
            {isConnected ? (
              <div className="wallet-info">
                <div className="wallet-address">
                  {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : ""}
                </div>
                <ConnectButton.Custom>
                  {({ openAccountModal }) => (
                    <button onClick={openAccountModal} className="disconnect-btn">
                      Disconnect
                    </button>
                  )}
                </ConnectButton.Custom>
              </div>
            ) : (
              <ConnectButton.Custom>
                {({ openConnectModal, mounted }) => (
                  <button
                    onClick={openConnectModal}
                    className="connect-btn"
                    disabled={!mounted}
                  >
                    Connect Wallet
                  </button>
                )}
              </ConnectButton.Custom>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        {/* Home Section */}
        <section id="home" className="section">
          <div className="container">
            <div className="hero-content">
              <h1 className="hero-title">Sepolia Ethereum Transfer</h1>
              <p className="hero-subtitle">Fast and secure blockchain transactions</p>

              <div className="transfer-card">
                <div className="balance-display">
                  <span className="balance-label">Balance</span>
                  <span className="balance-value">{balance} ETH</span>
                </div>

                <div className="transfer-form">
                  <div className="form-group">
                    <label htmlFor="receiver">Receiver Address</label>
                    <input
                      id="receiver"
                      type="text"
                      placeholder="0x..."
                      value={receiver}
                      onChange={(e) => setReceiver(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="amount">Amount (ETH)</label>
                    <input
                      id="amount"
                      type="number"
                      step="0.0001"
                      placeholder="0.0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>

                  <button
                    className={`send-btn ${loading ? "loading" : ""}`}
                    onClick={sendMoney}
                    disabled={loading || !isConnected}
                  >
                    {loading ? (
                      <span className="loading-spinner"></span>
                    ) : (
                      <>
                        <Send size={16} />
                        <span>Send ETH</span>
                      </>
                    )}
                  </button>

                  {!isConnected && (
                    <p className="connect-notice">
                      Please connect your wallet to send transactions
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="social-links">
            <a
              href="https://github.com/Blazeeth"
              target="_blank"
              rel="noopener noreferrer"
              className="social-icon"
            >
              <Github size={24} />
            </a>
          </div>
        </section>

        {/* Transactions Section */}
        <section id="transactions" className="section">
          <div className="container">
            <h2 className="section-title">Transaction History</h2>

            <div className="transaction-container">
              {(!transactions || transactions.length === 0) ? (
                <div className="no-transactions">
                  <p>No transactions yet</p>
                  {!isConnected && <p>Connect your wallet to view transactions</p>}
                </div>
              ) : (
                <div className="transaction-list">
                  {transactions.map((tx, index) => (
                    <div key={index} className="transaction-item">
                      <div className="transaction-details">
                        <div className="transaction-addresses">
                          <span className="address from">{`${tx.sender.slice(0, 6)}...${tx.sender.slice(-4)}`}</span>
                          <span className="arrow">→</span>
                          <span className="address to">{`${tx.receiver.slice(0, 6)}...${tx.receiver.slice(-4)}`}</span>
                        </div>
                        <div className="transaction-amount">
                          {formatEther(tx.amount)} ETH
                        </div>
                      </div>
                      <div className="transaction-explorer">
                        <a
                          href={`https://sepolia.etherscan.io/tx/${tx.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink size={16} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="section">
          <div className="container">
            <div className="about-content">
              <h2 className="section-title">About BLX</h2>
              <div className="about-description">
                <p>
                  BLX dApp is a user-friendly decentralized application designed to simplify cryptocurrency transactions on the Ethereum blockchain. With a sleek, intuitive interface, BLX allows users to seamlessly send ETH, track their wallet balance, and view transaction history all in one place.
                </p>
                <p>
                  Whether you're a crypto novice or a seasoned user, BLX dApp provides a secure and efficient way to manage your digital assets, complete with explorer links for transparency and a dedicated contact section to stay connected. Built for accessibility, BLX dApp empowers users to engage with blockchain technology effortlessly.
                </p>
              </div>

              <div className="feature-cards">
                <div className="feature-card">
                  <h3>Secure</h3>
                  <p>Built on Ethereum's proven blockchain technology</p>
                </div>
                <div className="feature-card">
                  <h3>Fast</h3>
                  <p>Quick transactions with minimal confirmation time</p>
                </div>
                <div className="feature-card">
                  <h3>Simple</h3>
                  <p>User-friendly interface for beginners and experts</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="section">
          <div className="container">
            <h2 className="section-title">Contact Us</h2>

            <div className="contact-container">
              <form className="contact-form" onSubmit={handleContactSubmit}>
                <div className="form-group">
                  <label htmlFor="name">Name</label>
                  <input
                    id="name"
                    type="text"
                    name="name"
                    placeholder="Your Name"
                    value={contactForm.name}
                    onChange={handleContactChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="your.email@example.com"
                    value={contactForm.email}
                    onChange={handleContactChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="message">Message</label>
                  <textarea
                    id="message"
                    name="message"
                    placeholder="Your message here..."
                    value={contactForm.message}
                    onChange={handleContactChange}
                    required
                  ></textarea>
                </div>

                <button type="submit" className="submit-btn">Send Message</button>
              </form>

              <div className="contact-info">
                <h3>Connect With Us</h3>
                <div className="social-links-contact">
                  <a href="https://x.com" target="_blank" rel="noopener noreferrer">Twitter</a>
                  <a href="https://github.com" target="_blank" rel="noopener noreferrer">Github</a>
                  <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">LinkedIn</a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer>
        <div className="container">
          <div className="footer-content">
            <div className="footer-copyright">
              <p>Copyright © 2025 blxdapp.com. All rights reserved</p>
            </div>
            <div className="footer-links">
              <ul>
                <li onClick={() => scrollToSection("home")}>Home</li>
                <li onClick={() => scrollToSection("transactions")}>Transactions</li>
                <li onClick={() => scrollToSection("about")}>About</li>
                <li onClick={() => scrollToSection("contact")}>Contact</li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;