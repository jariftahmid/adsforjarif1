const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

// Toggle user role
exports.toggleUserRole = functions.https.onCall(async (data, context) => {
  if (!context.auth.token.admin) throw new functions.https.HttpsError("permission-denied");
  const { uid, newRole } = data;
  if (context.auth.uid === uid) throw new functions.https.HttpsError("failed-precondition","Admin cannot change own role");

  await admin.auth().setCustomUserClaims(uid, { admin: newRole==="admin" });
  await admin.firestore().collection("users").doc(uid).update({ role: newRole });
  await admin.firestore().collection("adminLogs").add({
    action:`Changed role to ${newRole}`,
    performedBy: context.auth.token.email,
    targetUser: uid,
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });
  return { success:true };
});

// Add new admin
exports.addAdmin = functions.https.onCall(async (data, context) => {
  if (!context.auth.token.admin) throw new functions.https.HttpsError("permission-denied");
  const { uid } = data;
  await admin.auth().setCustomUserClaims(uid, { admin: true });
  await admin.firestore().collection("users").doc(uid).update({ role:"admin" });
  return { success:true };
});

// Approve points
exports.givePoints = functions.https.onCall(async (data, context) => {
  if (!context.auth.token.admin) throw new functions.https.HttpsError("permission-denied");
  const { userId, requestId, points } = data;
  await admin.firestore().collection("taskRequests").doc(requestId).update({
    status:"approved",
    pointsGiven: points,
    approvedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  await admin.firestore().collection("users").doc(userId).update({
    totalPoints: admin.firestore.FieldValue.increment(points)
  });
  return { success:true };
});
