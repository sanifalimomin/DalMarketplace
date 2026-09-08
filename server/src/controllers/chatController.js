const crypto = require("crypto");
const serverClient = require("../config/stream");
const { db } = require("../config/firebase");

async function getToken(req, res, next) {
  try {
    const { userId, name, bannerId } = req.user;

    await serverClient.upsertUser({
      id: userId,
      name: name || bannerId || "Dal Marketplace User",
    });

    const token = serverClient.createToken(userId);

    return res.status(200).json({ token });
  } catch (error) {
    next(error);
  }
}

async function createListingChannel(req, res, next) {
  try {
    const { listingId } = req.params;
    const buyerId = req.user.userId;

    const listingRef = db.collection("listings").doc(listingId);
    const listingSnapshot = await listingRef.get();

    if (!listingSnapshot.exists) {
      return res.status(404).json({
        error: "Listing not found.",
      });
    }

    const listing = listingSnapshot.data();
    const sellerId = listing.sellerId;

    if (!sellerId) {
      return res.status(400).json({
        error: "This listing has no seller ID.",
      });
    }

    if (buyerId === sellerId) {
      return res.status(400).json({
        error: "You cannot message yourself about your own listing.",
      });
    }

    const members = [buyerId, sellerId].sort();

    const rawChannelKey = `${listingId}:${members[0]}:${members[1]}`;

    //Generate a listing id based channel id using a hash of the listing id and the two members
    const channelId = `listing-${crypto
      .createHash("sha256")
      .update(rawChannelKey)
      .digest("hex")
      .slice(0, 32)}`;

    const buyerUserSnapshot = await db.collection("users").doc(buyerId).get();
    const sellerUserSnapshot = await db.collection("users").doc(sellerId).get();

    const buyer = buyerUserSnapshot.exists ? buyerUserSnapshot.data() : {};
    const seller = sellerUserSnapshot.exists ? sellerUserSnapshot.data() : {};

    //Retrieve the buyer and seller names from the database and upsert them to stream
    await serverClient.upsertUsers([
      {
        id: buyerId,
        name: buyer.name || req.user.name || req.user.bannerId || "Buyer",
      },
      {
        id: sellerId,
        name: seller.name || "Seller",
      },
    ]);

    //Create a channel that invites both the buyer and seller to chat about the listing
    const channel = serverClient.channel("messaging", channelId, {
      members,
      created_by_id: buyerId,
      name: listing.title || "Listing conversation",
      listingId,
      listingTitle: listing.title || "",
      listingPrice: listing.price || 0,
      buyerId,
      sellerId,
    });

    await channel.create();

    //Save to firestore after creating the channel in stream
    await db
      .collection("chats")
      .doc(channelId)
      .set(
        {
          channelId,
          channelType: "messaging",
          listingId,
          listingTitle: listing.title || "",
          buyerId,
          sellerId,
          members,
          updatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
        { merge: true },
      );

    return res.status(200).json({
      channelId,
      channelType: "messaging",
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getToken,
  createListingChannel,
};