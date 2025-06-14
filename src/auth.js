export const authenticateUser = async (req) => {
  const dummyUsers = {
    jaden: {
      customerID: "e8f9g0h1-2i3j-4k5l-6m7n-8o9p0q1r2s3t",
      name: "Jaden",
      image: "https://placehold.co/256x256?text=J"
    },
    alex: {
      customerID: "a1b2c3d4-e5f6-7890-abcd-ef0123456789",
      name: "Alex",
      image: "https://placehold.co/256x256?text=A"
    },
    riley: {
      customerID: "9876abcd-4321-efgh-ijkl-1234567890ab",
      name: "Riley",
      image: "https://placehold.co/256x256?text=R"
    }
  };

  const key =
    req?.query?.user ||
    req?.headers?.["x-user-id"] ||
    process.env.DUMMY_USER_ID ||
    "jaden";

  return dummyUsers[key] || dummyUsers["jaden"];
};