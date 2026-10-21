    import readline from 'readline';

    const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
    });

    // ACTIVE QUEUE STARTS COMPLETELY CLEAN / EMPTY ON FRESH OPEN
    let activeQueue = [];

    // OLD / PAST COMPLAINTS ARE AUTOMATICALLY HIDDEN & MOVED HERE ON OPEN
    let historyQueue = [
    {
        id: 'CMP-70595',
        text: 'fire accident ishappened on rajkot',
        category: '🔥 Fire & HAZMAT Hazard',
        time: '12:14:43 am',
        status: 'Resolved'
    }
    ];

    function showHeader() {
    console.clear();
    const historyText = `[ 📜 HISTORY (${historyQueue.length}) ]`;
    const headerTitle = "🚨 EMERGENCY DISPATCH MANAGEMENT PORTAL";
    const padding = " ".repeat(Math.max(0, 65 - headerTitle.length - historyText.length));

    console.log('==================================================================');
    console.log(`${headerTitle}${padding}${historyText}`);
    console.log('==================================================================');
    }

    function showMenu() {
    showHeader();
    console.log(` Active Queue: [${activeQueue.length} Active]  |  Archived: [${historyQueue.length} Hidden in History]`);
    console.log('------------------------------------------------------------------');
    console.log('1. 📥 Submit New Emergency Complaint');
    console.log('2. 📋 View Active Dispatch Queue');
    console.log('3. 👁️  Hide / Archive Complaints to History');
    console.log('4. 📜 View Top-Right History (Archived Old Complaints)');
    console.log('5. 🚪 Exit');
    
    rl.question('\nSelect an option (1-5): ', (choice) => {
        switch (choice.trim()) {
        case '1':
            submitComplaint();
            break;
        case '2':
            viewActiveQueue();
            break;
        case '3':
            hideMenu();
            break;
        case '4':
            viewHistory();
            break;
        case '5':
            console.log('\nExiting Portal...');
            rl.close();
            break;
        default:
            promptReturn('Invalid option. Press Enter to try again...');
        }
    });
    }

    function submitComplaint() {
    showHeader();
    console.log('--- SUBMIT NEW EMERGENCY COMPLAINT ---');
    rl.question('Enter incident details: ', (text) => {
        if (text.trim()) {
        const incident = {
            id: 'CMP-' + Math.floor(10000 + Math.random() * 90000),
            text: text.trim(),
            time: new Date().toLocaleTimeString(),
            status: 'Active'
        };
        activeQueue.push(incident);
        promptReturn(`\n✅ New Incident logged! Ticket ID: [${incident.id}]`);
        } else {
        promptReturn('\n❌ Incident details cannot be empty.');
        }
    });
    }

    function viewActiveQueue() {
    showHeader();
    console.log('--- ACTIVE DISPATCH QUEUE ---');
    if (activeQueue.length === 0) {
        console.log('✨ Active Queue is completely clear!');
        console.log('   All old/past complaints have been hidden and moved to History.');
    } else {
        activeQueue.forEach((item, idx) => {
        console.log(`\n[${idx + 1}] ID: [${item.id}]  |  Time: ${item.time}`);
        console.log(`    Details: ${item.text}`);
        console.log('    ----------------------------------------------------------');
        });
    }
    promptReturn('\nPress Enter to return to main menu...');
    }

    function hideMenu() {
    showHeader();
    console.log('--- HIDE & ARCHIVE ACTION ---');
    if (activeQueue.length === 0) {
        promptReturn('✨ No active complaints to hide. Main queue is already clear.');
        return;
    }

    console.log('1. Hide All Active Complaints');
    console.log('2. Hide Specific Complaint by ID');
    
    rl.question('\nChoose option (1-2): ', (subChoice) => {
        if (subChoice.trim() === '1') {
        const movedCount = activeQueue.length;
        historyQueue.push(...activeQueue);
        activeQueue = [];
        promptReturn(`\n👁️ Success: Moved ${movedCount} active item(s) to History.`);
        } else if (subChoice.trim() === '2') {
        rl.question('Enter Ticket ID to hide (e.g., CMP-12345): ', (targetId) => {
            const index = activeQueue.findIndex(item => item.id.toUpperCase() === targetId.trim().toUpperCase());
            if (index !== -1) {
            const removed = activeQueue.splice(index, 1)[0];
            historyQueue.push(removed);
            promptReturn(`\n👁️ Ticket [${removed.id}] hidden and moved to History!`);
            } else {
            promptReturn('\n❌ Ticket ID not found in Active Queue.');
            }
        });
        } else {
        promptReturn('\nInvalid choice.');
        }
    });
    }

    function viewHistory() {
    showHeader();
    console.log(`--- 📜 ARCHIVED COMPLAINT HISTORY (${historyQueue.length}) ---`);
    if (historyQueue.length === 0) {
        console.log('No archived items found.');
    } else {
        historyQueue.forEach((item, idx) => {
        console.log(`\n[ARCHIVED #${idx + 1}] ID: [${item.id}] | Time: ${item.time}`);
        console.log(`    Description: ${item.text}`);
        if (item.category) console.log(`    Category: ${item.category}`);
        console.log('    ----------------------------------------------------------');
        });
    }
    promptReturn('\nPress Enter to return to main menu...');
    }

    function promptReturn(msg) {
    console.log(msg);
    rl.question('', () => {
        showMenu();
    });
    }

    // Start CLI
    showMenu();
