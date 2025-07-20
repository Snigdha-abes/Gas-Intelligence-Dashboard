⛽ Cross-Chain Gas Tracker & Simulator
This project is a dynamic, real-time dashboard designed to provide users with crucial insights into blockchain transaction costs. Built with a modern Next.js and TypeScript frontend, it simulates gas fees across multiple chains and visualizes Ethereum's gas price volatility.


✨ Core Features
🎨 Professional UI/UX: Features a modern, aesthetically pleasing dark-mode interface with a glassmorphism effect, subtle animations, and a fully responsive design for all screen sizes.

💰 Multi-Chain Gas Simulator: Allows users to estimate the USD cost of a transaction on Ethereum, Polygon, and Arbitrum by simply entering an amount of ETH.

📈 Real-Time Volatility Chart: An interactive candlestick chart, powered by lightweight-charts, visualizes Ethereum's gas price fluctuations over 15-minute intervals.

🔄 Live Data Polling: The application fetches the latest gas prices periodically, ensuring the chart data remains fresh and relevant for users.

⚙️ Full-Stack Architecture: Built on a standard and scalable decoupled architecture, with a Next.js frontend and a Node.js/Express backend.

🛠️ Technology Stack
This project was built using a modern set of tools and libraries to deliver a robust and high-quality user experience.

Category

Technology

Frontend

Next.js, React, TypeScript, Tailwind CSS

Charting

Lightweight Charts™

Backend

Node.js, Express.js

API Communication

Axios

Blockchain Interaction

Ethers.js (used in the backend to communicate with RPC endpoints)

🏗️ Architectural Decisions
Data Fetching Strategy: A polling mechanism (setInterval with axios) was implemented for the real-time chart to fetch data every 30 seconds. This approach provides near real-time data effectively and is simpler to implement than a WebSocket connection for the scope of this project.

State Management: State is managed using React's native useState and useRef hooks. For a single-page application of this complexity, this is a lightweight and efficient solution that avoids the overhead of external libraries like Zustand or Redux.

UI/UX Philosophy: The user interface was built with Tailwind CSS and features a dark-mode, "glassmorphism" theme. This modern design choice enhances visual appeal and improves the overall user experience.

🔮 Potential Future Enhancements
Real-Time WebSocket Integration: Upgrade the data fetching mechanism to use WebSocket providers for instantaneous, push-based data updates.

Expanded Chain Support: Integrate additional popular EVM chains into the simulator and charting components.

Historical Data Analysis: Implement a feature allowing users to select and view historical gas price data from specific date ranges.