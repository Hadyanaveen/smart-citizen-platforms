import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { auth, db, storage } from "./myfirebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

const DAILY_TASKS = [
  { id: "d1", title: "Carry your own water bottle today", points: 5 },
  { id: "d2", title: "Avoid one plastic bag today", points: 5 },
  { id: "d3", title: "Segregate dry and wet waste", points: 8 },
  { id: "d4", title: "Switch off unused lights for one full day", points: 5 },
  { id: "d5", title: "Use public transport or walk for a short trip", points: 8 },
  { id: "d6", title: "Collect 10 plastic wrappers from home", points: 10 },
  { id: "d7", title: "Reuse one container instead of throwing it", points: 5 },
  { id: "d8", title: "Plant one sapling", points: 15 },
  { id: "d9", title: "Post one eco-awareness message", points: 5 },
  { id: "d10", title: "Report one environmental issue in your area", points: 15 },
];

const WEEKLY_CHALLENGES = [
  { id: "w1", title: "No Plastic Challenge for 3 Days", points: 25 },
  { id: "w2", title: "Zero Food Waste Challenge", points: 20 },
  { id: "w3", title: "Clean Your Street Corner Challenge", points: 25 },
  { id: "w4", title: "Home Waste Segregation Challenge", points: 20 },
  { id: "w5", title: "Save Water Challenge", points: 20 },
  { id: "w6", title: "Reusable Lunchbox Challenge", points: 15 },
  { id: "w7", title: "Old Clothes Donation Challenge", points: 20 },
  { id: "w8", title: "Neighborhood Awareness Poster Challenge", points: 25 },
];

const STARTUPS = [
  {
    id: "s1",
    name: "ReWrap Studio",
    accepts: "Plastic wrappers, milk covers, chips packets",
    creates: "Pouches, tote bags, organizers",
    pickupAreas: "Bengaluru East, Whitefield, KR Puram",
    contact: "+91 98765 10001 | rewrap@greenmail.com",
    story: "Converts multilayer plastic into stitched lifestyle products.",
  },
  {
    id: "s2",
    name: "EcoBrick Loop",
    accepts: "PET bottles, bottle caps, plastic packaging",
    creates: "Eco-bricks, décor blocks, small furniture panels",
    pickupAreas: "Bengaluru South, Jayanagar, BTM",
    contact: "+91 98765 10002 | ecobrick@greenmail.com",
    story: "Builds reusable structural blocks from hard-to-recycle plastics.",
  },
  {
    id: "s3",
    name: "ThreadCycle",
    accepts: "Old jeans, fabric scraps, cloth waste, banners",
    creates: "Bags, cushion covers, pouches",
    pickupAreas: "Bengaluru North, Hebbal, Yelahanka",
    contact: "+91 98765 10003 | threadcycle@greenmail.com",
    story: "Upcycles discarded textiles into attractive handmade products.",
  },
  {
    id: "s4",
    name: "PaperRoot",
    accepts: "Newspapers, cardboard, paper scraps",
    creates: "Seed paper, recycled notebooks, organizers",
    pickupAreas: "All Bengaluru drop-box model",
    contact: "+91 98765 10004 | paperroot@greenmail.com",
    story: "Turns paper waste into plantable and reusable stationery.",
  },
  {
    id: "s5",
    name: "E-Clear",
    accepts: "Old chargers, wires, small e-waste accessories",
    creates: "Certified e-waste recovery partnerships",
    pickupAreas: "Authorized city collection points",
    contact: "+91 98765 10005 | eclear@greenmail.com",
    story: "Connects households to safe e-waste recycling channels.",
  },
];

const MARKETPLACE_ITEMS = [
  "Donate recyclables",
  "Volunteer for cleanup",
  "Join tree planting",
  "Help awareness campaign",
  "Support local green startup",
  "Exchange reusable items",
  "List upcycled products",
];

const DROP_POINTS = [
  "Whitefield Recycling Center",
  "Indiranagar Cloth Donation Bin",
  "Jayanagar Compost Hub",
  "Koramangala E-Waste Drop Box",
  "HSR Startup Collection Point",
];

const EVENTS = [
  {
    id: "e1",
    title: "Sunday Park Cleanup",
    location: "Cubbon Park",
    date: "Sunday 8:00 AM",
    impact: "Beautify public space + 25 volunteer points",
  },
  {
    id: "e2",
    title: "Apartment Waste Segregation Drive",
    location: "Local Communities",
    date: "Saturday 5:00 PM",
    impact: "Teach households correct segregation",
  },
  {
    id: "e3",
    title: "Lake Cleanup Campaign",
    location: "Bellandur Lake Area",
    date: "Sunday 7:00 AM",
    impact: "Waterbody conservation awareness",
  },
  {
    id: "e4",
    title: "No-Plastic Market Campaign",
    location: "Local Market Zones",
    date: "Friday 4:00 PM",
    impact: "Promote reusable bag culture",
  },
];

const QUIZ_QUESTIONS = [
  {
    id: "q1",
    question: "Which bin should banana peel go into?",
    options: ["Dry Waste", "Wet Waste", "E-Waste", "Hazardous Waste"],
    correct: "Wet Waste",
  },
  {
    id: "q2",
    question: "Used batteries belong to which category?",
    options: ["Wet Waste", "Dry Waste", "Hazardous Waste", "Compost"],
    correct: "Hazardous Waste",
  },
  {
    id: "q3",
    question: "Which action helps reduce single-use plastic?",
    options: [
      "Using disposable cups daily",
      "Carrying a reusable bottle",
      "Throwing wrappers in mixed waste",
      "Burning plastic",
    ],
    correct: "Carrying a reusable bottle",
  },
];

function App() {
  const [isSignup, setIsSignup] = useState(true);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("citizen");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);

  const [activeTab, setActiveTab] = useState("dashboard");

  const [issueText, setIssueText] = useState("");
  const [category, setCategory] = useState("");
  const [severity, setSeverity] = useState("medium");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [location, setLocation] = useState(null);
  const [locationText, setLocationText] = useState("Location not added");

  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [taskProof, setTaskProof] = useState("");
  const [completedToday, setCompletedToday] = useState({});
  const [selectedProgressText, setSelectedProgressText] = useState({});
  const [wasteType, setWasteType] = useState("");
  const [wasteQty, setWasteQty] = useState("");
  const [selectedStartup, setSelectedStartup] = useState("");
  const [wasteRequests, setWasteRequests] = useState([]);

  const [trainerItem, setTrainerItem] = useState("");
  const [trainerResult, setTrainerResult] = useState("");

  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([
    {
      sender: "bot",
      text: "Hi. Ask me anything about the website, pollution, rewards, eco tasks, waste segregation, or sustainability.",
    },
  ]);

  const [selectedQuiz, setSelectedQuiz] = useState({});
  const [taskOfTheDay] = useState(DAILY_TASKS[new Date().getDate() % DAILY_TASKS.length]);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser || null);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user) {
      setUserData(null);
      return;
    }

    const unsubUser = onSnapshot(doc(db, "users", user.uid), (snap) => {
      if (snap.exists()) setUserData(snap.data());
    });

    return () => unsubUser();
  }, [user]);

  useEffect(() => {
    const unsubReports = onSnapshot(collection(db, "reports"), (snapshot) => {
      const data = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));
      data.sort((a, b) => {
        const at = a.createdAt?.seconds || 0;
        const bt = b.createdAt?.seconds || 0;
        return bt - at;
      });
      setReports(data);
    });

    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const data = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));
      setUsers(data);
    });

    const unsubNotifications = onSnapshot(collection(db, "notifications"), (snapshot) => {
      const all = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));
      const mine = user ? all.filter((n) => n.userId === user.uid) : [];
      setNotifications(mine);
    });

    const unsubWaste = onSnapshot(collection(db, "wasteRequests"), (snapshot) => {
      const data = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));
      setWasteRequests(data);
    });

    return () => {
      unsubReports();
      unsubUsers();
      unsubNotifications();
      unsubWaste();
    };
  }, [user]);

  const myReports = useMemo(() => {
    if (!user) return [];
    return reports.filter((r) => r.userId === user.uid);
  }, [reports, user]);

  const leaderboard = useMemo(() => {
    return [...users].sort((a, b) => (b.impactScore || 0) - (a.impactScore || 0));
  }, [users]);

  const pendingCount = reports.filter((r) => r.status === "Pending").length;
  const progressCount = reports.filter((r) => r.status === "In Progress").length;
  const resolvedCount = reports.filter((r) => r.status === "Resolved").length;

  function rewardTier(points) {
    if (points >= 500) return "Singapore Trip Contest";
    if (points >= 300) return "Electronic Gadget Lucky Draw";
    if (points >= 150) return "Clothing Coupon";
    if (points >= 50) return "Grocery Coupon";
    return "Starter Reward";
  }

  function ecoLevel(score) {
    if (score >= 300) return "Green Hero";
    if (score >= 180) return "Gold Eco Citizen";
    if (score >= 90) return "Silver Eco Citizen";
    return "Bronze Eco Citizen";
  }

  function detectCategory(text) {
    const t = text.toLowerCase();
    if (t.includes("water") || t.includes("leak")) return "Water";
    if (t.includes("garbage") || t.includes("trash") || t.includes("waste")) return "Garbage";
    if (t.includes("pollution") || t.includes("smoke") || t.includes("air")) return "Pollution";
    if (t.includes("road") || t.includes("pothole")) return "Road";
    if (t.includes("light") || t.includes("electric")) return "Electricity";
    return "General";
  }

  function approveEnvironmentalImage(text, categoryValue, file) {
    const combined = `${text} ${categoryValue} ${file?.name || ""}`.toLowerCase();
    const keywords = [
      "water",
      "leak",
      "pollution",
      "garbage",
      "waste",
      "trash",
      "road",
      "pothole",
      "electric",
      "light",
      "smoke",
      "drain",
      "plastic",
      "wrapper",
      "sewage",
      "environment",
    ];
    return keywords.some((k) => combined.includes(k));
  }

  function impactFromSeverity(value) {
    if (value === "high") return 25;
    if (value === "medium") return 15;
    return 10;
  }

  function generateResolutionArticle(report, progressUpdates = []) {
    const updates =
      progressUpdates.length > 0
        ? progressUpdates.map((u) => u.text).join(", ")
        : "The authority handled the issue through inspection and resolution.";

    return `Title: ${report.category} Issue Successfully Resolved

A community issue was reported by ${report.userName || report.userEmail} regarding "${report.issue}". The issue was categorized under ${report.category} and supported with location and image evidence. The authority team reviewed the complaint and took action. Important progress included: ${updates}. The issue was ultimately resolved, reducing environmental impact and improving local community well-being. This case highlights the importance of citizen participation, sustainability-focused action, and timely authority response.`;
  }

  async function updateUserMetrics(userId, changes) {
    const userRef = doc(db, "users", userId);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return;
    const current = snap.data();

    const updated = {
      rewardPoints: (current.rewardPoints || 0) + (changes.rewardPoints || 0),
      ecoStreak: Math.max(0, (current.ecoStreak || 0) + (changes.ecoStreak || 0)),
      impactScore: (current.impactScore || 0) + (changes.impactScore || 0),
      rewardsUnlocked: [...(current.rewardsUnlocked || [])],
      completedTasks: [...(current.completedTasks || [])],
      completedChallenges: [...(current.completedChallenges || [])],
      joinedEvents: [...(current.joinedEvents || [])],
    };

    const unlock = rewardTier(updated.rewardPoints);
    if (!updated.rewardsUnlocked.includes(unlock)) {
      updated.rewardsUnlocked.push(unlock);
    }

    if (changes.addCompletedTask && !updated.completedTasks.includes(changes.addCompletedTask)) {
      updated.completedTasks.push(changes.addCompletedTask);
    }

    if (
      changes.addCompletedChallenge &&
      !updated.completedChallenges.includes(changes.addCompletedChallenge)
    ) {
      updated.completedChallenges.push(changes.addCompletedChallenge);
    }

    if (changes.addJoinedEvent && !updated.joinedEvents.includes(changes.addJoinedEvent)) {
      updated.joinedEvents.push(changes.addJoinedEvent);
    }

    await updateDoc(userRef, updated);
  }

  async function handleSignup() {
    try {
      if (!name || !phone || !email || !password) {
        alert("Please fill all fields.");
        return;
      }

      const res = await createUserWithEmailAndPassword(auth, email, password);

      await setDoc(doc(db, "users", res.user.uid), {
        name,
        phone,
        role,
        email,
        rewardPoints: 0,
        ecoStreak: 0,
        impactScore: 0,
        rewardsUnlocked: [],
        completedTasks: [],
        completedChallenges: [],
        joinedEvents: [],
        createdAt: new Date().toISOString(),
      });

      alert("Signup successful!");
      setName("");
      setPhone("");
      setEmail("");
      setPassword("");
      setRole("citizen");
    } catch (error) {
      alert(error.message);
    }
  }

  async function handleLogin() {
    try {
      if (!email || !password) {
        alert("Please enter email and password.");
        return;
      }
      await signInWithEmailAndPassword(auth, email, password);
      alert("Login successful!");
      setEmail("");
      setPassword("");
    } catch (error) {
      alert(error.message);
    }
  }

  async function handleLogout() {
    try {
      await signOut(auth);
      setActiveTab("dashboard");
      alert("Logged out successfully!");
    } catch (error) {
      alert(error.message);
    }
  }

  function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  }

  function handleGetLocation() {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setLocation(coords);
        setLocationText(`Lat: ${coords.lat.toFixed(5)}, Lng: ${coords.lng.toFixed(5)}`);
      },
      () => alert("Could not fetch location.")
    );
  }

  async function handleSubmitReport() {
    try {
      if (!issueText || !category || !severity) {
        alert("Please fill all issue details.");
        return;
      }
      if (!imageFile) {
        alert("Please upload an image.");
        return;
      }
      if (!location) {
        alert("Please fetch location.");
        return;
      }

      const approved = approveEnvironmentalImage(issueText, category, imageFile);
      if (!approved) {
        alert("Issue not found. Upload an image related to an environmental issue.");
        return;
      }

      const autoCategory = detectCategory(issueText);
      const finalCategory = category || autoCategory;

      const storageRef = ref(storage, `reports/${Date.now()}_${imageFile.name}`);
      await uploadBytes(storageRef, imageFile);
      const imageUrl = await getDownloadURL(storageRef);

      await addDoc(collection(db, "reports"), {
        issue: issueText,
        category: finalCategory,
        severity,
        imageUrl,
        imageApproved: true,
        userId: user.uid,
        userEmail: user.email,
        userName: userData?.name || "",
        phone: userData?.phone || "",
        location,
        locationText,
        status: "Pending",
        progressUpdates: [
          {
            text: "Complaint submitted successfully.",
            time: new Date().toLocaleString(),
          },
        ],
        impactValue: impactFromSeverity(severity),
        rewardGranted: false,
        articleText: "",
        createdAt: serverTimestamp(),
      });

      await updateUserMetrics(user.uid, {
        rewardPoints: 10,
        ecoStreak: 1,
        impactScore: impactFromSeverity(severity),
      });

      await addDoc(collection(db, "notifications"), {
        userId: user.uid,
        message: `Report submitted successfully. You earned 10 points.`,
        createdAt: serverTimestamp(),
      });

      alert("Report submitted successfully!");

      setIssueText("");
      setCategory("");
      setSeverity("medium");
      setImageFile(null);
      setImagePreview("");
      setLocation(null);
      setLocationText("Location not added");
    } catch (error) {
      alert(error.message);
    }
  }

  async function completeTask(task) {
    try {
      if (!taskProof.trim()) {
        alert("Please upload or enter proof text for the task.");
        return;
      }

      await updateUserMetrics(user.uid, {
        rewardPoints: task.points,
        ecoStreak: 1,
        impactScore: 5,
        addCompletedTask: task.id,
      });

      await addDoc(collection(db, "notifications"), {
        userId: user.uid,
        message: `Task completed: "${task.title}". You earned ${task.points} points.`,
        createdAt: serverTimestamp(),
      });

      setCompletedToday((prev) => ({ ...prev, [task.id]: true }));
      setTaskProof("");
      alert("Task completed successfully!");
    } catch (error) {
      alert(error.message);
    }
  }

  async function completeChallenge(challenge) {
    try {
      await updateUserMetrics(user.uid, {
        rewardPoints: challenge.points,
        ecoStreak: 2,
        impactScore: 15,
        addCompletedChallenge: challenge.id,
      });

      await addDoc(collection(db, "notifications"), {
        userId: user.uid,
        message: `Challenge completed: "${challenge.title}". You earned ${challenge.points} points.`,
        createdAt: serverTimestamp(),
      });

      alert("Challenge marked complete!");
    } catch (error) {
      alert(error.message);
    }
  }

  async function joinEvent(eventItem) {
    try {
      await updateUserMetrics(user.uid, {
        rewardPoints: 20,
        ecoStreak: 1,
        impactScore: 10,
        addJoinedEvent: eventItem.id,
      });

      await addDoc(collection(db, "notifications"), {
        userId: user.uid,
        message: `You joined "${eventItem.title}" and earned 20 points.`,
        createdAt: serverTimestamp(),
      });

      alert("Joined event successfully!");
    } catch (error) {
      alert(error.message);
    }
  }

  async function submitWasteRequest() {
    try {
      if (!wasteType || !wasteQty || !selectedStartup) {
        alert("Please fill waste type, quantity, and startup.");
        return;
      }

      await addDoc(collection(db, "wasteRequests"), {
        userId: user.uid,
        userName: userData?.name || "",
        userEmail: user.email,
        phone: userData?.phone || "",
        wasteType,
        quantity: wasteQty,
        startup: selectedStartup,
        status: "Requested",
        createdAt: serverTimestamp(),
      });

      await updateUserMetrics(user.uid, {
        rewardPoints: 15,
        ecoStreak: 1,
        impactScore: 12,
      });

      await addDoc(collection(db, "notifications"), {
        userId: user.uid,
        message: `Waste-to-startup request sent to ${selectedStartup}.`,
        createdAt: serverTimestamp(),
      });

      alert("Waste request submitted!");
      setWasteType("");
      setWasteQty("");
      setSelectedStartup("");
    } catch (error) {
      alert(error.message);
    }
  }

  async function updateReportStatus(report, newStatus) {
    try {
      const progress = Array.isArray(report.progressUpdates) ? [...report.progressUpdates] : [];
      progress.push({
        text: `Status changed to ${newStatus}`,
        time: new Date().toLocaleString(),
      });

      const payload = {
        status: newStatus,
        progressUpdates: progress,
      };

      if (newStatus === "Resolved") {
        payload.articleText = generateResolutionArticle(report, progress);

        if (!report.rewardGranted) {
          await updateUserMetrics(report.userId, {
            rewardPoints: 50,
            impactScore: 20,
          });

          await addDoc(collection(db, "notifications"), {
            userId: report.userId,
            message: `Your issue "${report.issue}" is resolved. You earned 50 bonus points.`,
            createdAt: serverTimestamp(),
          });

          payload.rewardGranted = true;
        }
      }

      await updateDoc(doc(db, "reports", report.id), payload);
    } catch (error) {
      alert(error.message);
    }
  }

  async function addProgressUpdate(report) {
    try {
      const text = selectedProgressText[report.id];
      if (!text) {
        alert("Enter progress update text.");
        return;
      }

      const progress = Array.isArray(report.progressUpdates) ? [...report.progressUpdates] : [];
      progress.push({
        text,
        time: new Date().toLocaleString(),
      });

      await updateDoc(doc(db, "reports", report.id), {
        progressUpdates: progress,
      });

      await addDoc(collection(db, "notifications"), {
        userId: report.userId,
        message: `Update on your issue "${report.issue}": ${text}`,
        createdAt: serverTimestamp(),
      });

      setSelectedProgressText((prev) => ({
        ...prev,
        [report.id]: "",
      }));

      alert("Progress updated!");
    } catch (error) {
      alert(error.message);
    }
  }

  function segregationResult(item) {
    const value = item.toLowerCase();
    if (value.includes("banana") || value.includes("food") || value.includes("peel")) {
      return "Wet Waste / Compostable";
    }
    if (value.includes("battery")) {
      return "Hazardous Waste";
    }
    if (value.includes("charger") || value.includes("wire")) {
      return "E-Waste";
    }
    if (value.includes("plastic bottle") || value.includes("milk packet")) {
      return "Dry Waste / Recyclable";
    }
    if (value.includes("paper cup")) {
      return "Usually Dry Waste, may be non-recyclable if laminated";
    }
    return "Please sort based on local rules: dry / wet / hazardous / e-waste.";
  }

  function handleTrainer() {
    if (!trainerItem.trim()) {
      alert("Enter an item name.");
      return;
    }
    setTrainerResult(segregationResult(trainerItem));
  }

  function chatbotReply(question) {
    const q = question.toLowerCase();

    if (q.includes("how to report")) {
      return "Go to Report, write the issue, choose category and severity, upload a valid issue image, fetch GPS location, and submit.";
    }
    if (q.includes("reward") || q.includes("points")) {
      return "You earn green coins through valid reports, eco tasks, challenges, events, and startup recycle requests. Those unlock coupons, lucky draws, and more.";
    }
    if (q.includes("pollution")) {
      return "Pollution can be air, water, soil, or noise related. This platform helps users report local environmental pollution and learn sustainable habits.";
    }
    if (q.includes("streak")) {
      return "Your eco streak grows when you keep completing sustainability actions regularly.";
    }
    if (q.includes("startup")) {
      return "Visit Waste to Value or Startup Showcase to connect recyclable waste to local green startups and see their contact details.";
    }
    if (q.includes("website")) {
      return "This website combines issue reporting, sustainability education, rewards, tasks, startup connect, leaderboard, and authority action tracking.";
    }
    if (q.includes("segregation")) {
      return "Use the Waste Trainer tab to learn whether an item is dry waste, wet waste, hazardous waste, or e-waste.";
    }
    return "I can help with reporting issues, pollution, eco tasks, rewards, streaks, startup recycling, events, leaderboard, and waste segregation.";
  }

  function sendChat() {
    if (!chatInput.trim()) return;

    const userMessage = { sender: "user", text: chatInput };
    const botMessage = { sender: "bot", text: chatbotReply(chatInput) };

    setChatMessages((prev) => [...prev, userMessage, botMessage]);
    setChatInput("");
  }

  async function submitQuiz(question) {
    try {
      const selected = selectedQuiz[question.id];
      if (!selected) {
        alert("Select an answer first.");
        return;
      }

      if (selected === question.correct) {
        await updateUserMetrics(user.uid, {
          rewardPoints: 10,
          impactScore: 5,
        });
        alert("Correct answer! +10 points");
      } else {
        alert(`Wrong answer. Correct answer: ${question.correct}`);
      }
    } catch (error) {
      alert(error.message);
    }
  }

  if (!user) {
    return (
      <div className="page">
        <div className="auth-card">
          <h1 className="title">{isSignup ? "Signup" : "Login"}</h1>

          {isSignup && (
            <>
              <label className="label">Full Name</label>
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter full name"
              />

              <label className="label">Phone</label>
              <input
                className="input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter phone number"
              />

              <label className="label">Role</label>
              <select
                className="input"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="citizen">Citizen</option>
                <option value="authority">Authority</option>
              </select>
            </>
          )}

          <label className="label">Email</label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email"
          />

          <label className="label">Password</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
          />

          <button className="primary-btn full-btn" onClick={isSignup ? handleSignup : handleLogin}>
            {isSignup ? "Signup" : "Login"}
          </button>

          <button className="secondary-btn full-btn" onClick={() => setIsSignup(!isSignup)}>
            {isSignup ? "Go to Login" : "Go to Signup"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="dashboard-container">
        <div className="hero-card">
          <div>
            <p className="hero-badge">Eco Education + Gamification + Civic Action + Circular Economy</p>
            <h1 className="main-heading">Smart Citizen Platform</h1>
            <p className="sub-heading">Logged in as: <strong>{user.email}</strong></p>
            <p className="sub-heading">Role: <strong>{userData?.role || "citizen"}</strong></p>
          </div>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>

        <div className="tabs">
          <button className={activeTab === "dashboard" ? "tab active-tab" : "tab"} onClick={() => setActiveTab("dashboard")}>Dashboard</button>
          <button className={activeTab === "report" ? "tab active-tab" : "tab"} onClick={() => setActiveTab("report")}>Report</button>
          <button className={activeTab === "tasks" ? "tab active-tab" : "tab"} onClick={() => setActiveTab("tasks")}>Daily Tasks</button>
          <button className={activeTab === "challenges" ? "tab active-tab" : "tab"} onClick={() => setActiveTab("challenges")}>Challenges</button>
          <button className={activeTab === "startups" ? "tab active-tab" : "tab"} onClick={() => setActiveTab("startups")}>Startups</button>
          <button className={activeTab === "market" ? "tab active-tab" : "tab"} onClick={() => setActiveTab("market")}>Marketplace</button>
          <button className={activeTab === "events" ? "tab active-tab" : "tab"} onClick={() => setActiveTab("events")}>Events</button>
          <button className={activeTab === "trainer" ? "tab active-tab" : "tab"} onClick={() => setActiveTab("trainer")}>Waste Trainer</button>
          <button className={activeTab === "quiz" ? "tab active-tab" : "tab"} onClick={() => setActiveTab("quiz")}>Quiz</button>
          <button className={activeTab === "leaderboard" ? "tab active-tab" : "tab"} onClick={() => setActiveTab("leaderboard")}>Leaderboard</button>
          <button className={activeTab === "chatbot" ? "tab active-tab" : "tab"} onClick={() => setActiveTab("chatbot")}>Chatbot</button>
          <button className={activeTab === "notifications" ? "tab active-tab" : "tab"} onClick={() => setActiveTab("notifications")}>Notifications</button>
        </div>

        {activeTab === "dashboard" && (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>{reports.length}</h3>
                <p>Total Reports</p>
              </div>
              <div className="stat-card">
                <h3>{pendingCount}</h3>
                <p>Pending</p>
              </div>
              <div className="stat-card">
                <h3>{progressCount}</h3>
                <p>In Progress</p>
              </div>
              <div className="stat-card">
                <h3>{resolvedCount}</h3>
                <p>Resolved</p>
              </div>
            </div>

            <div className="grid">
              <div className="panel">
                <h2>Profile</h2>
                <p><strong>Name:</strong> {userData?.name || "-"}</p>
                <p><strong>Phone:</strong> {userData?.phone || "-"}</p>
                <p><strong>Role:</strong> {userData?.role || "-"}</p>
                <p><strong>Eco Level:</strong> {ecoLevel(userData?.impactScore || 0)}</p>
                <p><strong>Reward Tier:</strong> {rewardTier(userData?.rewardPoints || 0)}</p>
              </div>

              <div className="panel">
                <h2>Sustainability Journey</h2>
                <p><strong>Reward Points:</strong> {userData?.rewardPoints || 0}</p>
                <p><strong>Eco Streak:</strong> {userData?.ecoStreak || 0}</p>
                <p><strong>Impact Score:</strong> {userData?.impactScore || 0}</p>
                <p><strong>Actions Completed:</strong> {(userData?.completedTasks || []).length}</p>
                <p><strong>Events Joined:</strong> {(userData?.joinedEvents || []).length}</p>
                <p><strong>Rewards Unlocked:</strong> {(userData?.rewardsUnlocked || []).join(", ") || "None yet"}</p>
              </div>
            </div>

            <div className="panel" style={{ marginTop: "18px" }}>
              <h2>Today’s Green Mission</h2>
              <p><strong>{taskOfTheDay.title}</strong></p>
              <p>Reward: +{taskOfTheDay.points} points</p>
              <p>Bonus: eco streak increase + habit-building reward</p>
            </div>

            <div className="panel" style={{ marginTop: "18px" }}>
              <h2>Real Impact Metrics</h2>
              <p><strong>Community Issues Resolved:</strong> {resolvedCount}</p>
              <p><strong>Plastic Recycling Requests Sent:</strong> {wasteRequests.filter((w) => w.userId === user.uid).length}</p>
              <p><strong>Volunteering / Events Joined:</strong> {(userData?.joinedEvents || []).length}</p>
              <p><strong>Estimated Environmental Impact Score:</strong> {userData?.impactScore || 0}</p>
            </div>
          </>
        )}

        {activeTab === "report" && (
          <>
            {userData?.role === "citizen" && (
              <div className="panel report-panel">
                <h2>Report an Environmental Issue</h2>

                <label className="label">Issue Description</label>
                <textarea
                  className="input textarea"
                  value={issueText}
                  onChange={(e) => setIssueText(e.target.value)}
                  placeholder="Describe issue like water leakage, garbage, pollution..."
                />

                <label className="label">Category</label>
                <select
                  className="input"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="">Select Category</option>
                  <option value="Water">Water</option>
                  <option value="Garbage">Garbage</option>
                  <option value="Pollution">Pollution</option>
                  <option value="Road">Road</option>
                  <option value="Electricity">Electricity</option>
                  <option value="General">General</option>
                </select>

                <label className="label">Severity</label>
                <select
                  className="input"
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>

                <label className="label">Upload Image</label>
                <input className="input" type="file" accept="image/*" onChange={handleImageChange} />

                {imagePreview && (
                  <div className="preview-box">
                    <img src={imagePreview} alt="preview" className="preview-image" />
                  </div>
                )}

                <label className="label">GPS Location</label>
                <button className="secondary-btn" onClick={handleGetLocation}>
                  Fetch My Location
                </button>
                <p className="small-text">{locationText}</p>

                <button className="primary-btn" onClick={handleSubmitReport}>
                  Submit Report
                </button>
              </div>
            )}

            <div className="panel" style={{ marginTop: "18px" }}>
              <h2>{userData?.role === "authority" ? "Authority Dashboard" : "All Reports"}</h2>

              {reports.length === 0 ? (
                <p>No reports yet.</p>
              ) : (
                reports.map((r) => (
                  <div key={r.id} className="report-card">
                    <p><strong>Issue:</strong> {r.issue}</p>
                    <p><strong>Category:</strong> {r.category}</p>
                    <p><strong>Severity:</strong> {r.severity || "-"}</p>
                    <p><strong>Status:</strong> {r.status}</p>
                    <p><strong>User:</strong> {r.userName || r.userEmail || "-"}</p>
                    <p><strong>Location:</strong> {r.locationText || "-"}</p>

                    {r.imageUrl && (
                      <a href={r.imageUrl} target="_blank" rel="noreferrer" className="link-btn">
                        View Uploaded Image
                      </a>
                    )}

                    {Array.isArray(r.progressUpdates) && r.progressUpdates.length > 0 && (
                      <div className="progress-box">
                        <strong>Progress Updates:</strong>
                        {r.progressUpdates.map((p, index) => (
                          <div key={index} className="progress-item">
                            <span>{p.text}</span>
                            <small>{p.time}</small>
                          </div>
                        ))}
                      </div>
                    )}

                    {r.articleText && (
                      <div className="article-box">
                        <strong>Resolution Article:</strong>
                        <p>{r.articleText}</p>
                      </div>
                    )}

                    {userData?.role === "authority" && (
                      <div className="authority-actions">
                        <button onClick={() => updateReportStatus(r, "Pending")}>Pending</button>
                        <button onClick={() => updateReportStatus(r, "In Progress")}>In Progress</button>
                        <button onClick={() => updateReportStatus(r, "Resolved")}>Resolved</button>

                        <input
                          className="input small-input"
                          placeholder="Add progress update"
                          value={selectedProgressText[r.id] || ""}
                          onChange={(e) =>
                            setSelectedProgressText((prev) => ({
                              ...prev,
                              [r.id]: e.target.value,
                            }))
                          }
                        />

                        <button onClick={() => addProgressUpdate(r)}>Update Progress</button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {activeTab === "tasks" && (
          <div className="panel">
            <h2>Daily Micro-Tasks</h2>
            <p>Build habits, increase eco streak, and earn rewards through small daily steps.</p>

            <label className="label">Proof Text / Note</label>
            <input
              className="input"
              value={taskProof}
              onChange={(e) => setTaskProof(e.target.value)}
              placeholder="Example: I carried my steel bottle to college today."
            />

            {DAILY_TASKS.map((task) => (
              <div key={task.id} className="report-card">
                <p><strong>{task.title}</strong></p>
                <p>Reward: +{task.points} points</p>
                <button onClick={() => completeTask(task)}>
                  {completedToday[task.id] ? "Completed" : "Complete Task"}
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === "challenges" && (
          <div className="panel">
            <h2>Weekly Sustainability Challenges</h2>
            {WEEKLY_CHALLENGES.map((challenge) => (
              <div key={challenge.id} className="report-card">
                <p><strong>{challenge.title}</strong></p>
                <p>Reward: +{challenge.points} points</p>
                <button onClick={() => completeChallenge(challenge)}>Mark Complete</button>
              </div>
            ))}
          </div>
        )}

        {activeTab === "startups" && (
          <>
            <div className="panel">
              <h2>Waste to Value / Recycle Partner Connect</h2>

              <label className="label">Waste Type</label>
              <input
                className="input"
                value={wasteType}
                onChange={(e) => setWasteType(e.target.value)}
                placeholder="Plastic wrappers, bottles, cloth waste, paper..."
              />

              <label className="label">Quantity</label>
              <input
                className="input"
                value={wasteQty}
                onChange={(e) => setWasteQty(e.target.value)}
                placeholder="Example: 2 bags, 15 bottles, 3 kg"
              />

              <label className="label">Startup / Recycler</label>
              <select
                className="input"
                value={selectedStartup}
                onChange={(e) => setSelectedStartup(e.target.value)}
              >
                <option value="">Select Startup</option>
                {STARTUPS.map((s) => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>

              <button className="primary-btn" onClick={submitWasteRequest}>
                Send Waste Request
              </button>
            </div>

            <div className="panel" style={{ marginTop: "18px" }}>
              <h2>Green Startup Showcase</h2>
              {STARTUPS.map((s) => (
                <div key={s.id} className="report-card">
                  <p><strong>{s.name}</strong></p>
                  <p><strong>Accepts:</strong> {s.accepts}</p>
                  <p><strong>Creates:</strong> {s.creates}</p>
                  <p><strong>Pickup Areas:</strong> {s.pickupAreas}</p>
                  <p><strong>Contact:</strong> {s.contact}</p>
                  <p><strong>Story:</strong> {s.story}</p>
                </div>
              ))}
            </div>

            <div className="panel" style={{ marginTop: "18px" }}>
              <h2>My Waste Requests</h2>
              {wasteRequests.filter((w) => w.userId === user.uid).length === 0 ? (
                <p>No waste requests yet.</p>
              ) : (
                wasteRequests
                  .filter((w) => w.userId === user.uid)
                  .map((w) => (
                    <div key={w.id} className="report-card">
                      <p><strong>Waste:</strong> {w.wasteType}</p>
                      <p><strong>Quantity:</strong> {w.quantity}</p>
                      <p><strong>Startup:</strong> {w.startup}</p>
                      <p><strong>Status:</strong> {w.status}</p>
                    </div>
                  ))
              )}
            </div>
          </>
        )}

        {activeTab === "market" && (
          <>
            <div className="panel">
              <h2>Eco Action Marketplace</h2>
              {MARKETPLACE_ITEMS.map((item, index) => (
                <div key={index} className="report-card">
                  <p><strong>{item}</strong></p>
                </div>
              ))}
            </div>

            <div className="panel" style={{ marginTop: "18px" }}>
              <h2>Nearby Green Drop Points</h2>
              {DROP_POINTS.map((point, index) => (
                <div key={index} className="report-card">
                  <p>{point}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === "events" && (
          <div className="panel">
            <h2>Community Cleanup Campaigns & Events</h2>
            {EVENTS.map((eventItem) => (
              <div key={eventItem.id} className="report-card">
                <p><strong>{eventItem.title}</strong></p>
                <p><strong>Location:</strong> {eventItem.location}</p>
                <p><strong>Date:</strong> {eventItem.date}</p>
                <p><strong>Impact:</strong> {eventItem.impact}</p>
                <button onClick={() => joinEvent(eventItem)}>Join Event</button>
              </div>
            ))}
          </div>
        )}

        {activeTab === "trainer" && (
          <div className="panel">
            <h2>Waste Segregation Trainer</h2>
            <input
              className="input"
              value={trainerItem}
              onChange={(e) => setTrainerItem(e.target.value)}
              placeholder="Example: milk packet, banana peel, battery, old charger"
            />
            <button onClick={handleTrainer}>Where should this go?</button>

            {trainerResult && (
              <div className="report-card">
                <p><strong>Result:</strong> {trainerResult}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "quiz" && (
          <div className="panel">
            <h2>Educational Quiz Mode</h2>
            {QUIZ_QUESTIONS.map((q) => (
              <div key={q.id} className="report-card">
                <p><strong>{q.question}</strong></p>
                {q.options.map((option) => (
                  <label key={option} className="quiz-option">
                    <input
                      type="radio"
                      name={q.id}
                      checked={selectedQuiz[q.id] === option}
                      onChange={() =>
                        setSelectedQuiz((prev) => ({
                          ...prev,
                          [q.id]: option,
                        }))
                      }
                    />
                    <span>{option}</span>
                  </label>
                ))}
                <button onClick={() => submitQuiz(q)}>Submit Answer</button>
              </div>
            ))}
          </div>
        )}

        {activeTab === "leaderboard" && (
          <div className="panel">
            <h2>Gamified City Leaderboard</h2>
            {leaderboard.length === 0 ? (
              <p>No leaderboard data yet.</p>
            ) : (
              leaderboard.map((u, index) => (
                <div key={u.id} className="leaderboard-item">
                  <div>
                    <strong>#{index + 1} {u.name}</strong>
                    <p>{u.email}</p>
                  </div>
                  <div>
                    <p><strong>Impact:</strong> {u.impactScore || 0}</p>
                    <p><strong>Points:</strong> {u.rewardPoints || 0}</p>
                    <p><strong>Streak:</strong> {u.ecoStreak || 0}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "chatbot" && (
          <div className="panel chatbot-panel">
            <h2>Website + Pollution Chatbot</h2>
            <div className="chat-window">
              {chatMessages.map((msg, index) => (
                <div key={index} className={msg.sender === "bot" ? "chat-bot" : "chat-user"}>
                  {msg.text}
                </div>
              ))}
            </div>

            <div className="chat-input-row">
              <input
                className="input"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask anything about website, pollution, rewards, tasks..."
              />
              <button onClick={sendChat}>Send</button>
            </div>
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="panel">
            <h2>Notifications</h2>
            {notifications.length === 0 ? (
              <p>No notifications yet.</p>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="report-card">
                  <p>{n.message}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
