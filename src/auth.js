export const authenticateUser = async (req) => {
  const dummyUsers = {
    jaden: {
      customerID: "e8f9g0h1-2i3j-4k5l-6m7n-8o9p0q1r2s3t",
      name: "Jaden",
      image: "https://placehold.co/256x256/E2F2F4/4BB8A7?text=J"
    },
    alex: {
      customerID: "a2v3w4x5-6z7a-8b9c-d0e1-f2g3h4i5j6k7",
      name: "Alex",
      image: "https://placehold.co/256x256/E2F2F4/4BB8A7?text=A"
    },
    riley: {
      customerID: "a3f2b8c9-55c0-4d7d-9874-4b8f8c9d1a2b",
      name: "Riley",
      image: "https://placehold.co/256x256/E2F2F4/4BB8A7?text=R"
    }
  };

  const key =
    req?.query?.user ||
    req?.headers?.["x-user-id"] ||
    process.env.DUMMY_USER_ID ||
    "jaden";

  return dummyUsers[key] || dummyUsers["jaden"];
};