Here are **50 React.js best practices** grouped by category, with practical examples and explanations. These practices align with modern React (18+) using hooks, functional components, TypeScript-friendly patterns, and scalable application architecture.

---

# 1. Use Functional Components Instead of Class Components

### ❌ Avoid

```jsx
class User extends React.Component {
 render() {
 return <div>{this.props.name}</div>;
 }
}
```

### ✅ Prefer

```jsx
function User({ name }) {
 return <div>{name}</div>;
}
```

Benefits:

* Simpler
* Better Hooks support
* Less boilerplate

---

# 2. Keep Components Small

### ❌ Bad

```jsx
function Dashboard() {
 // 500 lines of code
}
```

### ✅ Better

```jsx
function Dashboard() {
 return (
 <>
 <Header />
 <Sidebar />
 <Content />
 </>
 );
}
```

Rule:

> One component = one responsibility.

---

# 3. Use Destructuring

### ❌

```jsx
function User(props) {
 return <h1>{props.name}</h1>;
}
```

### ✅

```jsx
function User({ name }) {
 return <h1>{name}</h1>;
}
```

---

# 4. Use Meaningful Component Names

### ❌

```jsx
function Comp1() {}
```

### ✅

```jsx
function UserProfile() {}
```

---

# 5. Use PascalCase for Components

```jsx
function UserCard() {}
```

Not:

```jsx
function userCard() {}
```

---

# 6. Keep JSX Clean

### ❌

```jsx
return (
<div>
<div>
<div>
<h1>Hello</h1>
</div>
</div>
</div>
)
```

### ✅

```jsx
return (
 <section>
 <h1>Hello</h1>
 </section>
);
```

---

# 7. Use Fragments Instead of Extra div

### ❌

```jsx
return (
 <div>
 <Header />
 <Content />
 </div>
);
```

### ✅

```jsx
return (
 <>
 <Header />
 <Content />
 </>
);
```

---

# 8. Avoid Inline Functions in Large Lists

### ❌

```jsx
items.map(item =>
 <Button onClick={() => deleteItem(item.id)} />
)
```

### ✅

```jsx
const handleDelete = useCallback((id) => {
 deleteItem(id);
}, []);

items.map(item =>
 <Button onClick={() => handleDelete(item.id)} />
)
```

---

# 9. Use Proper Keys

### ❌

```jsx
items.map((item, index) =>
 <Item key={index} />
)
```

### ✅

```jsx
items.map(item =>
 <Item key={item.id} />
)
```

---

# 10. Never Use Array Index as Key

Unless list never changes.

Bad:

```jsx
key={index}
```

Good:

```jsx
key={user.id}
```

---

# 11. Extract Reusable Components

### ❌

```jsx
<button className="primary">
 Save
</button>
```

Repeated 20 times.

### ✅

```jsx
function PrimaryButton(props) {
 return <button className="primary" {...props} />;
}
```

---

# 12. Use Custom Hooks

### ❌

Duplicated fetch logic everywhere.

### ✅

```jsx
function useUsers() {
 const [users, setUsers] = useState([]);

 useEffect(() => {
 fetchUsers().then(setUsers);
 }, []);

 return users;
}
```

---

# 13. Keep Hooks at Top Level

### ❌

```jsx
if (show) {
 useEffect(() => {});
}
```

### ✅

```jsx
useEffect(() => {
 if(show) {}
}, [show]);
```

---

# 14. Follow Hook Dependency Rules

### ❌

```jsx
useEffect(() => {
 fetchUser(id);
}, []);
```

### ✅

```jsx
useEffect(() => {
 fetchUser(id);
}, [id]);
```

---

# 15. Use useMemo for Expensive Computations

```jsx
const total = useMemo(() => {
 return calculateTotal(items);
}, [items]);
```

---

# 16. Use useCallback for Stable Functions

```jsx
const handleSave = useCallback(() => {
 save();
}, []);
```

---

# 17. Avoid Premature Optimization

Don't wrap everything with:

```jsx
useMemo()
useCallback()
React.memo()
```

Measure first.

---

# 18. Use React.memo

```jsx
const UserCard = React.memo(({ user }) => {
 return <div>{user.name}</div>;
});
```

---

# 19. Avoid Deep Prop Drilling

### ❌

```jsx
App
 ↓
Page
 ↓
Section
 ↓
Widget
 ↓
User
```

### ✅

Use Context.

---

# 20. Use Context Carefully

Good for:

* Theme
* Auth
* Language

Bad for:

* Frequently changing large data

---

# 21. Split Contexts

### ❌

```jsx
AppContext
```

contains everything.

### ✅

```jsx
AuthContext
ThemeContext
LanguageContext
```

---

# 22. Keep State Close to Usage

Don't lift state unnecessarily.

---

# 23. Avoid Duplicated State

### ❌

```jsx
const [users, setUsers] = useState([]);
const [userCount, setUserCount] = useState(0);
```

### ✅

```jsx
const userCount = users.length;
```

---

# 24. Normalize Complex State

### ❌

```jsx
users: [
 {
 posts:[]
 }
]
```

### ✅

```jsx
{
 usersById:{},
 postsById:{}
}
```

---

# 25. Use Reducers for Complex State

```jsx
const [state, dispatch] = useReducer(reducer, initialState);
```

---

# 26. Avoid Massive useState Chains

### ❌

```jsx
const [name]
const [email]
const [phone]
const [city]
...
```

### ✅

```jsx
const [form, setForm] = useState({});
```

---

# 27. Use TypeScript

```tsx
type User = {
 id:number;
 name:string;
}
```

Huge reduction in bugs.

---

# 28. Define Interfaces for Props

```tsx
interface UserCardProps {
 user: User;
}
```

---

# 29. Avoid Any

### ❌

```tsx
user:any
```

### ✅

```tsx
user:User
```

---

# 30. Use Optional Chaining

```jsx
user?.profile?.name
```

Instead of:

```jsx
user && user.profile && user.profile.name
```

---

# 31. Handle Loading States

```jsx
if (loading) {
 return <Spinner />;
}
```

---

# 32. Handle Error States

```jsx
if(error){
 return <ErrorMessage />;
}
```

---

# 33. Use Error Boundaries

```jsx
<ErrorBoundary>
 <Dashboard />
</ErrorBoundary>
```

---

# 34. Lazy Load Pages

```jsx
const Dashboard = lazy(() =>
 import("./Dashboard")
);
```

---

# 35. Use Suspense

```jsx
<Suspense fallback={<Loader />}>
 <Dashboard />
</Suspense>
```

---

# 36. Code Split Routes

```jsx
const Users = lazy(() =>
 import('./Users')
);
```

---

# 37. Keep API Calls Outside Components

### ❌

```jsx
fetch('/users')
```

inside every component.

### ✅

```jsx
userService.getUsers();
```

---

# 38. Create Service Layer

```jsx
export const userService = {
 getUsers,
 createUser
};
```

---

# 39. Use React Query / TanStack Query

```jsx
const { data } = useQuery({
 queryKey:['users'],
 queryFn:getUsers
});
```

Benefits:

* Caching
* Retry
* Refetching

---

# 40. Avoid useEffect for Data Fetching

Instead:

```jsx
useQuery()
```

Modern React standard.

---

# 41. Use Environment Variables

```env
VITE_API_URL=https://api.com
```

---

# 42. Never Store Secrets in Frontend

Bad:

```jsx
const apiKey = "secret";
```

---

# 43. Use ESLint

```bash
npm install eslint
```

---

# 44. Use Prettier

```bash
npm install prettier
```

---

# 45. Follow Feature-Based Structure

### Better

```text
src/
 ├── features/
 │ ├── users/
 │ ├── auth/
 │ └── products/
```

instead of:

```text
components/
hooks/
pages/
services/
```

for large apps.

---

# 46. Use Barrel Exports Carefully

```js
export * from './UserCard';
```

Useful but avoid huge index files.

---

# 47. Write Tests

Example:

```jsx
test("renders user", () => {
 render(<User name="John" />);
});
```

---

# 48. Use React Testing Library

```jsx
screen.getByText("John");
```

Test behavior, not implementation.

---

# 49. Avoid Business Logic in Components

### ❌

```jsx
function User() {
 // 100 lines of business logic
}
```

### ✅

```jsx
const user = useUser();
```

or

```jsx
userService.calculateDiscount();
```

---

# 50. Organize Enterprise React Apps

A scalable structure:

```text
src/
├── app/
│ ├── router
│ ├── providers
│ └── store
│
├── features/
│ ├── auth/
│ │ ├── api
│ │ ├── hooks
│ │ ├── components
│ │ ├── pages
│ │ └── types
│ │
│ └── users/
│
├── shared/
│ ├── components
│ ├── hooks
│ ├── utils
│ └── types
│
└── main.tsx
```

This structure scales well for teams of 5–100+ developers.

## Top 10 Most Important Practices for Production

1. Functional Components
2. TypeScript
3. Custom Hooks
4. Feature-based architecture
5. TanStack Query
6. Proper state management (Context/Zustand/Redux)
7. React.memo only where needed
8. Route code splitting
9. Error boundaries
10. Testing with React Testing Library

For large enterprise projects (Laravel API + React frontend), a particularly effective stack is:

* React 18+
* TypeScript
* Vite
* TanStack Query
* React Router
* Zustand (or Redux Toolkit if needed)
* React Hook Form
* Zod
* ESLint + Prettier
* Vitest + React Testing Library

This combination keeps codebases maintainable, performant, and scalable.
