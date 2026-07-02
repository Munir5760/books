// ==========================================
// SUPABASE CONFIGURATION
// ==========================================
// Copy and paste your project values from:
// Supabase Console -> Project Settings -> API
// ==========================================
const SUPABASE_URL = ""; 
const SUPABASE_KEY = ""; 

let supabaseClient = null;

// Determine if we have actual connection credentials
const hasSupabaseConfig = SUPABASE_URL.trim() !== "" && SUPABASE_KEY.trim() !== "";

if (hasSupabaseConfig) {
  // Initialise official Supabase JS SDK client
  supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  console.log("Supabase Online Database connected successfully.");
} else {
  console.warn("Supabase Config keys are empty. Initialising local database simulation (Mockup Mode).");
  
  // ==========================================
  // LOCAL STORAGE MOCK DATABASE FALLBACK ENGINE
  // ==========================================
  // This simulates the Supabase client-side API so the application continues
  // to run locally and offline if keys are not provided.
  
  // Seed local mockup database if needed
  if (!localStorage.getItem('novelnest_books')) {
    localStorage.setItem('novelnest_books', JSON.stringify([
      { id: 1, title: "The Midnight Library", author: "Matt Haig", price: 14.99, rating: 4.6, category: "fiction", published_year: 2020, cover_gradient: "linear-gradient(135deg, #6366f1, #a855f7)", description: "Between life and death there is a library, and within that library, the shelves go on forever. Every book provides a chance to try another life you could have lived.", stock: 12 },
      { id: 2, title: "Atomic Habits", author: "James Clear", price: 16.20, rating: 4.9, category: "self-help", published_year: 2018, cover_gradient: "linear-gradient(135deg, #f59e0b, #e11d48)", description: "No matter your goals, Atomic Habits offers a proven framework for improving—every day. James Clear, one of the world's leading experts on habit formation, reveals practical strategies.", stock: 8 },
      { id: 3, title: "Clean Code", author: "Robert C. Martin", price: 32.50, rating: 4.8, category: "tech", published_year: 2008, cover_gradient: "linear-gradient(135deg, #06b6d4, #3b82f6)", description: "Even bad code can run. But if code isn't clean, it can bring a development organization to its knees. Every year, countless hours and significant resources are lost because of poorly written code.", stock: 15 },
      { id: 4, title: "The Intelligent Investor", author: "Benjamin Graham", price: 22.99, rating: 4.7, category: "business", published_year: 1949, cover_gradient: "linear-gradient(135deg, #10b981, #059669)", description: "The greatest investment advisor of the twentieth century, Benjamin Graham, taught and inspired people worldwide. Graham's philosophy of 'value investing' has shielded investors from substantial error.", stock: 5 },
      { id: 5, title: "Klara and the Sun", author: "Kazuo Ishiguro", price: 15.99, rating: 4.2, category: "fiction", published_year: 2021, cover_gradient: "linear-gradient(135deg, #ec4899, #f43f5e)", description: "A magnificent new novel by the Nobel laureate Kazuo Ishiguro—his first since winning the Nobel Prize in Literature—that offers a thrilling look at our changing world through the eyes of an unforgettable narrator.", stock: 0 },
      { id: 6, title: "Designing Data-Intensive Applications", author: "Martin Kleppmann", price: 38.95, rating: 4.9, category: "tech", published_year: 2017, cover_gradient: "linear-gradient(135deg, #2563eb, #7c3aed)", description: "Want to understand how to design and build scalable, reliable, and maintainable systems? Learn how to navigate the diverse landscape of databases, queues, and stream processing.", stock: 6 },
      { id: 7, title: "Thinking, Fast and Slow", author: "Daniel Kahneman", price: 18.00, rating: 4.5, category: "self-help", published_year: 2011, cover_gradient: "linear-gradient(135deg, #f97316, #ea580c)", description: "Daniel Kahneman, the renowned psychologist and winner of the Nobel Prize in Economics, takes us on a groundbreaking tour of the mind and explains the two systems that drive the way we think.", stock: 10 },
      { id: 8, title: "Zero to One", author: "Peter Thiel", price: 14.50, rating: 4.4, category: "business", published_year: 2014, cover_gradient: "linear-gradient(135deg, #0d9488, #0ea5e9)", description: "If you want to build a better future, you must believe in secrets. The great secret of our time is that there are still uncharted frontiers to explore and new inventions to create.", stock: 4 }
    ]));
  }

  // Create Mock auth states
  let currentAuthStateChangeCallback = null;
  let simulatedUser = JSON.parse(localStorage.getItem('novelnest_user')) || null;

  supabaseClient = {
    // Auth Sim
    auth: {
      signUp: async ({ email, password }) => {
        // Simple client mock signup
        const username = email.split('@')[0];
        const role = email.toLowerCase().includes('admin') ? 'admin' : 'customer';
        const user = { id: Math.random().toString(36).substring(2), email, username, role };
        
        // Save mockup users
        let mockUsers = JSON.parse(localStorage.getItem('novelnest_mock_users')) || [];
        if (mockUsers.find(u => u.email === email)) {
          return { data: null, error: { message: "User already exists." } };
        }
        mockUsers.push(user);
        localStorage.setItem('novelnest_mock_users', JSON.stringify(mockUsers));

        simulatedUser = user;
        localStorage.setItem('novelnest_user', JSON.stringify(user));
        if (currentAuthStateChangeCallback) {
          currentAuthStateChangeCallback('SIGNED_IN', { user });
        }
        return { data: { user }, error: null };
      },
      
      signInWithPassword: async ({ email, password }) => {
        // Hardcoded account credentials check first
        if (email === 'admin@novelnest.com' || (email === 'admin' && password === 'admin123')) {
          const user = { id: 'admin-id-123', email: 'admin@novelnest.com', username: 'Admin', role: 'admin' };
          simulatedUser = user;
          localStorage.setItem('novelnest_user', JSON.stringify(user));
          if (currentAuthStateChangeCallback) {
            currentAuthStateChangeCallback('SIGNED_IN', { user });
          }
          return { data: { user }, error: null };
        }
        if (email === 'user@novelnest.com' || (email === 'user' && password === 'user123')) {
          const user = { id: 'user-id-567', email: 'user@novelnest.com', username: 'Munir', role: 'customer' };
          simulatedUser = user;
          localStorage.setItem('novelnest_user', JSON.stringify(user));
          if (currentAuthStateChangeCallback) {
            currentAuthStateChangeCallback('SIGNED_IN', { user });
          }
          return { data: { user }, error: null };
        }

        // Mock users check
        const mockUsers = JSON.parse(localStorage.getItem('novelnest_mock_users')) || [];
        const user = mockUsers.find(u => u.email === email);
        if (user) {
          simulatedUser = user;
          localStorage.setItem('novelnest_user', JSON.stringify(user));
          if (currentAuthStateChangeCallback) {
            currentAuthStateChangeCallback('SIGNED_IN', { user });
          }
          return { data: { user }, error: null };
        }

        return { data: null, error: { message: "Invalid credentials. Try demo credentials." } };
      },

      signOut: async () => {
        simulatedUser = null;
        localStorage.removeItem('novelnest_user');
        if (currentAuthStateChangeCallback) {
          currentAuthStateChangeCallback('SIGNED_OUT', null);
        }
        return { error: null };
      },

      getSession: async () => {
        return { data: { session: simulatedUser ? { user: simulatedUser } : null }, error: null };
      },

      onAuthStateChange: (callback) => {
        currentAuthStateChangeCallback = callback;
        // Trigger initial state
        setTimeout(() => {
          callback(simulatedUser ? 'SIGNED_IN' : 'SIGNED_OUT', simulatedUser ? { user: simulatedUser } : null);
        }, 50);
        return { data: { subscription: { unsubscribe: () => { currentAuthStateChangeCallback = null; } } } };
      }
    },

    // Database Mock chains
    from: (tableName) => {
      let getMockData = () => {
        if (tableName === 'books') {
          return JSON.parse(localStorage.getItem('novelnest_books')) || [];
        }
        if (tableName === 'orders') {
          return JSON.parse(localStorage.getItem('novelnest_orders')) || [];
        }
        return [];
      };

      let saveMockData = (data) => {
        if (tableName === 'books') {
          localStorage.setItem('novelnest_books', JSON.stringify(data));
        }
        if (tableName === 'orders') {
          localStorage.setItem('novelnest_orders', JSON.stringify(data));
        }
      };

      // Chain Object
      let queryChain = {
        filterField: null,
        filterValue: null,

        select: function() {
          return this;
        },

        eq: function(field, value) {
          this.filterField = field;
          this.filterValue = value;
          return this;
        },

        insert: async function(rows) {
          let current = getMockData();
          let newRows = Array.isArray(rows) ? rows : [rows];
          
          // Generate IDs
          newRows = newRows.map(r => {
            if (!r.id) r.id = Math.floor(Math.random() * 1000000);
            if (!r.created_at) r.created_at = new Date().toISOString();
            return r;
          });

          current.push(...newRows);
          saveMockData(current);
          return { data: newRows, error: null };
        },

        update: async function(changes) {
          let current = getMockData();
          let updated = current.map(item => {
            if (this.filterField && item[this.filterField] == this.filterValue) {
              return { ...item, ...changes };
            }
            return item;
          });
          saveMockData(updated);
          return { data: changes, error: null };
        },

        delete: async function() {
          let current = getMockData();
          let filtered = current.filter(item => {
            if (this.filterField && item[this.filterField] == this.filterValue) {
              return false; // remove
            }
            return true;
          });
          saveMockData(filtered);
          return { error: null };
        },

        // Final execution resolve
        then: function(resolve) {
          let data = getMockData();
          if (this.filterField) {
            data = data.filter(item => item[this.filterField] == this.filterValue);
          }
          resolve({ data, error: null });
        }
      };

      return queryChain;
    }
  };
}
