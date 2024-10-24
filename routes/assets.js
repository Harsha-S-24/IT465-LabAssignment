var express = require("express");
const router = express.Router();

const algosdk = require("algosdk");
const indexer_token = ""; // Add your indexer token if required
const indexer_server = "http://localhost"; // Change if your indexer is hosted elsewhere
const indexer_port = 8980;

// Instantiate the indexer client wrapper
let client = new algosdk.Indexer(indexer_token, indexer_server, indexer_port);

// Middleware that is specific to this router
router.use(function timeLog(req, res, next) {
  console.log("Assets router: ", Date.now());
  next();
});

// Search for asset by name
router.get("/name/:name", async function (req, res) {
  const assetSearchName = req.params.name;
  console.log("Searching for asset by name: ", assetSearchName);

  try {
    // Get all assets and filter by name locally
    let assetInfo = await client.searchForAssets().do();
    
    const assets = assetInfo.assets
      .filter(asset => asset.params.name === assetSearchName)
      .map(asset => ({
        id: asset.index,
        decimals: asset.params.decimals,
        name: asset.params.name,
        total: asset.params.total,
        frozen: asset.params["default-frozen"]
      }));

    if (assets.length === 0) {
      res.status(404).send({ message: "Asset not found" });
    } else {
      res.send(assets);
    }
  } catch (error) {
    console.error("Error searching for assets by name: ", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// Search for asset by index
router.get("/index/:index", async function (req, res) {
  const assetIndex = parseInt(req.params.index); // Convert index to integer
  console.log("Searching for asset by index: ", assetIndex);

  try {
    // Look up the asset by its index
    const assetInfo = await client.lookupAssetByID(assetIndex).do();

    // Format the asset information to send back
    const assetDetails = {
      id: assetInfo.asset.index,
      decimals: assetInfo.asset.params.decimals,
      name: assetInfo.asset.params.name,
      total: assetInfo.asset.params.total,
      frozen: assetInfo.asset.params["default-frozen"]
    };

    res.send(assetDetails);
  } catch (error) {
    console.error("Error searching for asset by index: ", error);
    if (error.message.includes("not found")) {
      res.status(404).send({ message: "Asset not found" });
    } else {
      res.status(500).send({ message: "Internal Server Error" });
    }
  }
});

module.exports = router;
