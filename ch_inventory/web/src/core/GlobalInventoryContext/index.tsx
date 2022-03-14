import React from "react";
import * as types from "@shared/types";
import _ from "lodash";
import { HoverItem } from "Slot/Slot";
import { getDurabilityPrecent2, sortItems } from "../utils";
// import { ItemData } from "config";
import { useNuiEvent } from "nui-events/hooks/useNuiEvent";
import Nui from "nui-events/utils/Nui";
import useKeypress from "hooks/useKeyPress";
import dayjs from "dayjs";

export type InventoryUnit = "first" | "secound";

type IHoverState = {
	slot: types.ISlot;
	unit: InventoryUnit;
	count: number;
};

interface IGiveProps {
	players: types.NearbyPlayer[];
	slot?: types.ISlot;
	visible?: boolean;
}

interface IGlobalInventoryContext {
	playerInventory?: types.IInventory;
	secoundInventory?: types.IInventory;
	hoverSlot?: IHoverState;
	setHoverSlot?: (newSlot: IHoverState | undefined) => void;
	moveItem?: (toSlot: types.ISlot, unit: InventoryUnit) => void;
	setMoveAmount?: (toSlot: number | string) => void;
	moveAmount?: number | string;
	quickMoveItem?: (slotToBeMoved: types.ISlot, fromUnit: InventoryUnit) => void;
	closeInventory?: () => void;
	useItem?: (slot: types.ISlot) => void;
	hotbarVisible?: boolean;
	itemData?: types.ItemDataHashMap;
	balance?: number;
	quickMove?: (hoverslot: IHoverState, unit: InventoryUnit) => void;
	giveMenuProps?: IGiveProps;
	giveItem?: (playerId: string, slot: types.ISlot) => void;
	clearGiveMenu?: () => void;
}

type ISlots = {
	[slotNumber: number]: types.ISlotData;
};

function calculateWeightOfSlots(slots: ISlots, itemData: types.ItemDataHashMap): number {
	let weight = 0;
	for (const slotIndex in slots) {
		const countItems = slots[slotIndex]?.items?.length ?? 0;
		const weightPrItem = itemData[slots[slotIndex]?.items?.[0]?.name ?? ""]?.itemWeight ?? 0;

		weight = weight + countItems * weightPrItem;
	}

	return weight;
}

const EmptyplayerInventory: types.IInventory = {
	owner: "1",
	slots: { },
	currentWeight: 0,
	totalSlots: 80,
	totalWeight: 120,
	type: "player",
};

const EmptysecoundInventory: types.IInventory = {
	owner: "1",
	slots: { },
	currentWeight: 0,
	totalSlots: 80,
	totalWeight: 120,
	type: "drop",
};

const GlobalInventoryContext = React.createContext<IGlobalInventoryContext>({ });

export const GlobalInventoryContextProvider: React.FC = ({ children }) => {
	const [playerInventory, setPlayerInventory] = React.useState<types.IInventory>(() => EmptyplayerInventory);
	const [secoundInventory, setSecoundInventory] = React.useState<types.IInventory>(() => EmptysecoundInventory);
	const [hotbarVisible, setHotbarVisible] = React.useState<boolean>(false);
	const [hoverSlot, setHoverSlot] = React.useState<IHoverState>();
	const [moveAmount, setMoveAmount] = React.useState<number | string>("");
	const [itemData, setItemData] = React.useState<types.ItemDataHashMap>();
	const [balance, setBalance] = React.useState<number>(0);
	const [nearbyPlayers, setNearbyPlayers] = React.useState<types.NearbyPlayer[]>([]);
	const [giveMenuProps, setGiveMenuProps] = React.useState<IGiveProps>();

	useNuiEvent("inventory", "setPlayerInventory", setPlayerInventory);
	useNuiEvent("inventory", "setSecoundInventory", setSecoundInventory);
	useNuiEvent("inventory", "setHotbarVisible", setHotbarVisible);
	useNuiEvent("inventory", "setItemData", setItemData);
	useNuiEvent("inventory", "setBalance", setBalance);
	useNuiEvent("inventory", "setNearbyPlayers", setNearbyPlayers);

	React.useEffect(() => {
		if (!itemData) {
			Nui.send("updateItemData");
		}
	}, [itemData]);

	function cleanUpSlots() {
		// first create a deep clone, to ensure that we dot not alter before we are ready
		const inventoryPlayerDeep = _.cloneDeep(playerInventory);
		const secoundInventoryrDeep = _.cloneDeep(secoundInventory);

		[inventoryPlayerDeep, secoundInventoryrDeep].every((inventory) =>
			_.each(inventory.slots, (slot, key) => {
				if (_.isEmpty(slot.items)) {
					delete inventory.slots[key];
				}
			})
		);

		setPlayerInventory(inventoryPlayerDeep);
		setSecoundInventory(secoundInventoryrDeep);
	}

	function updateInventories(singelInventory: types.IInventory, secoundInventory: types.IInventory) {
		if (itemData) {
			singelInventory = {
				...singelInventory,
				currentWeight: calculateWeightOfSlots(singelInventory.slots, itemData),
			};
			secoundInventory = {
				...secoundInventory,
				currentWeight: calculateWeightOfSlots(secoundInventory.slots, itemData),
			};

			if (
				singelInventory.currentWeight > singelInventory.totalWeight ||
				secoundInventory.currentWeight > secoundInventory.totalWeight
			) {
				setHoverSlot(undefined);
				return false;
			}

			[singelInventory, secoundInventory].every((inventory) =>
				_.each(inventory.slots, (slot, key) => {
					if (!slot.items || _.isEmpty(slot.items)) {
						delete inventory.slots[key];
					}
				})
			);

			setPlayerInventory(singelInventory);
			setSecoundInventory(secoundInventory);
		}
		setHoverSlot(undefined);

		return true;
	}

	function findFreeSlot(inventory: types.IInventory) {
		for (let slot = 0; slot < inventory.totalSlots; slot++) {
			if (!inventory.slots.hasOwnProperty(slot + 1)) {
				return slot + 1;
			}
		}

		return -1; // no slot available;
	}

	function findFreeSlotOrSameKind(inventory: types.IInventory, itemName: string, amountToBeAddedToSlot: number) {
		let slotIndex: string | undefined;
		_.each(inventory.slots, (slot, key) => {
			if (
				_.first(slot.items)?.name === itemName &&
				(slot.items?.length ?? 0) + amountToBeAddedToSlot <= (itemData?.[itemName]?.maxInStack ?? 64)
			) {
				slotIndex = key;
				return true;
			}
		});

		if (slotIndex) {
			return parseInt(slotIndex);
		}

		return findFreeSlot(inventory);
	}

	function quickMove(hoverSlot: IHoverState, fromUnit: InventoryUnit) {
		const toUnit = fromUnit === "first" ? "secound" : "first";
		const itemToBeMoved = _.first(hoverSlot?.slot?.items);

		if ((fromUnit === "first" && secoundInventory.type === "store") || !itemToBeMoved) {
			return;
		}

		const toInventory = toUnit === "first" ? playerInventory : secoundInventory;

		const amount = _.isNumber(moveAmount) ? moveAmount : 1;

		const toSlotNumber = findFreeSlotOrSameKind(toInventory, itemToBeMoved.name, amount);
		const baseSlot = {
			items: [],
			inventory: toInventory.type,
			owner: toInventory.owner,
			slotNumber: toSlotNumber,
		};
		const toSlot: types.ISlot = _.has(toInventory.slots, toSlotNumber)
			? { ...baseSlot, ...toInventory.slots[toSlotNumber] }
			: baseSlot;
		moveItem(toSlot, toUnit, hoverSlot);
	}

	function quickMoveItem(slotToBeMoved: types.ISlot, fromUnit: InventoryUnit) {
		const toUnit = fromUnit === "first" ? "secound" : "first";
		const itemToBeMoved = _.first(slotToBeMoved.items);

		if ((fromUnit === "first" && secoundInventory.type === "store") || !itemToBeMoved) {
			return;
		}

		const toInventory = toUnit === "first" ? playerInventory : secoundInventory;

		const amount = _.isNumber(moveAmount) ? moveAmount : 1;

		const toSlotNumber = findFreeSlotOrSameKind(toInventory, itemToBeMoved.name, amount);
		const baseSlot = {
			items: [],
			inventory: toInventory.type,
			owner: toInventory.owner,
			slotNumber: toSlotNumber,
		};
		const toSlot: types.ISlot = _.has(toInventory.slots, toSlotNumber)
			? { ...baseSlot, ...toInventory.slots[toSlotNumber] }
			: baseSlot;
		const hoverSlot: IHoverState = {
			count: amount,
			slot: slotToBeMoved,
			unit: fromUnit,
		};
		moveItem(toSlot, toUnit, hoverSlot);
	}

	function removeItemsFromSlot(
		inventory: types.IInventory,
		slotnumber: number,
		amountToBeDeleted: number,
		removeItemsThatAreWorn = false
	) {
		const slot: types.ISlotData = inventory.slots[slotnumber];

		let deletedItems = 0;
		const newItems: types.Item[] = [];
		_.each(slot.items, (item) => {
			const itemIsExpired =
				getDurabilityPrecent2(
					item.createdDate instanceof Date ? item.createdDate : new Date(item.createdDate),
					item.expiresAt ? (item.expiresAt instanceof Date ? item.expiresAt : new Date(item.expiresAt)) : null
				) <= 0;

			if ((itemIsExpired && removeItemsThatAreWorn) || deletedItems === amountToBeDeleted) {
				newItems.push(item);
			} else {
				deletedItems = deletedItems + 1;
			}
		});

		if (_.isEmpty(newItems)) {
			// there is not enough items left. Delete the whole slot.
			delete inventory.slots[slotnumber];
		} else {
			inventory.slots[slotnumber].items = newItems;
		}
	}

	function moveItem(toSlot: types.ISlot, toUnit: InventoryUnit, _hoverSlot?: IHoverState) {
		if (giveMenuProps) {
			return;
		}

		if (!_hoverSlot) {
			_hoverSlot = hoverSlot;
		}
		if (
			_.isUndefined(_hoverSlot) ||
			_hoverSlot?.count < 0 ||
			!(_hoverSlot.count <= (_hoverSlot?.slot.items?.length ?? 0)) ||
			(_hoverSlot.slot.slotNumber === toSlot.slotNumber && toSlot.inventory === _hoverSlot.slot.inventory)
		) {
			setHoverSlot(undefined);
			return true;
		}

		const inventories = {
			first: _.cloneDeep(playerInventory),
			secound: _.cloneDeep(secoundInventory),
		};

		const isBuying = _hoverSlot.slot.inventory === "store";
		const itemName = _.first(_hoverSlot.slot.items)?.name;
		const ItemData = itemData?.[itemName ?? ""] ?? undefined;
		const amountOfItemsToBuy = _hoverSlot.count;
		const pricePrItem = ItemData?.price ?? 0;
		const totalPrice = amountOfItemsToBuy * pricePrItem;
		const isWithinSameInventory =
			_hoverSlot.slot.inventory === toSlot.inventory && _hoverSlot.slot.owner === toSlot.owner;
		const isCrafting = _hoverSlot.slot.inventory === "crafting";

		if (toSlot.inventory === "store" || toSlot.inventory === "crafting") {
			return;
		}


		if (isCrafting || isBuying) {
			if (toSlot?.items.length && itemName !== _.first(toSlot?.items)?.name) {
				return; // prevent swap.
			}
		}

		if (isCrafting) {
			const itemToBeCrafted = _.first(_hoverSlot.slot.items);
			const recipe: types.Crafting | undefined = _hoverSlot?.slot?.recipe ?? itemData?.[itemToBeCrafted?.name ?? ""]?.crafting;
			if (itemToBeCrafted && recipe && !validateCustomCrafting(itemToBeCrafted?.name, recipe)) {
				setHoverSlot(undefined);
				return;
			}

			// remove items from locally..
			_.forEach(recipe?.itemsRequired, (item) => {
				if (item.itemName.startsWith("blueprint_")) {
					return; // don't want to remove blueprints
				}
				const slotIndex = hasItem(item.itemName, item.amount);

				if (slotIndex) {
					removeItemsFromSlot(inventories.first, parseInt(slotIndex), item.amount);
				}
			});
		}

		if (isBuying) {
			if (totalPrice > balance) {
				// stop moving.
				return;
			}

			// remove money from balance.
			setBalance((prev) => prev - totalPrice);
		}

		if (
			_.first(_hoverSlot.slot.items)?.name === "bag" &&
			hasItem("bag", 1, inventories[toUnit]) &&
			!isWithinSameInventory
		) {
			// check if the to inventory has a bag already
			return;
		}

		if (_.first(_hoverSlot.slot.items)?.name === "bag" && toSlot.inventory === "bag") {
			// prevent the ability to stuff a bag in a bag.
			return;
		}

		if (!toSlot.items.length || _.first(toSlot.items)?.name === _.first(_hoverSlot.slot.items)?.name) {
			// if slot is empty or has the same item type as hoverItem.

			if (_.first(toSlot.items)?.name === _.first(_hoverSlot.slot.items)?.name) {
				// check if adding hover items to toslot will exceed allowed maxstack
				const maxStack = ItemData?.maxInStack ?? 64;
				if (toSlot.items.length + _hoverSlot.slot.items.length > maxStack) {
					setHoverSlot(undefined);
					return false;
				}
			}

			if (_hoverSlot.slot.items.length === _hoverSlot.count) {
				delete inventories[_hoverSlot.unit].slots[_hoverSlot.slot.slotNumber];
			} else {
				if (
					_.has(inventories[toUnit].slots, toSlot.slotNumber) &&
					inventories[toUnit].slots[toSlot.slotNumber].items?.[0].name !== _hoverSlot.slot.items?.[0].name
				) {
					setHoverSlot(undefined);
					return true;
				}

				const itemsToSlot = [
					...(inventories[_hoverSlot.unit].slots[_hoverSlot.slot.slotNumber].items?.splice(
						0,
						_hoverSlot.count
					) ?? []),
				];

				if (_.isEmpty(inventories[_hoverSlot.unit].slots[_hoverSlot.slot.slotNumber].items)) {
					delete inventories[_hoverSlot.unit].slots[_hoverSlot.slot.slotNumber];
				}

				if (!_.has(inventories[toUnit].slots, toSlot.slotNumber)) {
					inventories[toUnit].slots[toSlot.slotNumber] = { items: sortItems(itemsToSlot) };
				} else {
					inventories[toUnit].slots[toSlot.slotNumber].items = sortItems([
						...itemsToSlot,
						...(inventories[toUnit].slots[toSlot.slotNumber].items ?? []),
					]);
				}

				if (updateInventories(inventories["first"], inventories["secound"])) {
					Nui.send("moveItem", {
						fromSlot: _hoverSlot.slot,
						toSlot: toSlot,
						count: _hoverSlot.count,
					});
					return true;
				}

				return false;
			}

			if (_.isEmpty(toSlot.items)) {
				inventories[toUnit].slots[toSlot.slotNumber] = _.pick(_hoverSlot.slot, ["items"]);
			} else {
				const newItems: types.Item[] = [...toSlot.items, ..._.take(_hoverSlot.slot.items, _hoverSlot.count)];
				const newSlot: types.ISlotData = { items: sortItems(newItems) };
				inventories[toUnit].slots[toSlot.slotNumber] = newSlot;
			}

			if (updateInventories(inventories["first"], inventories["secound"])) {
				Nui.send("moveItem", {
					fromSlot: _hoverSlot.slot,
					toSlot: toSlot,
					count: _hoverSlot.count,
				});
				return true;
			}

			return false;
		}

		if (!toSlot.items.length || _.first(toSlot.items)?.name !== _.first(_hoverSlot.slot.items)?.name) {
			// swap item positions
			const slotTemp: types.ISlot = toSlot;
			inventories[toUnit].slots[toSlot.slotNumber] = _.pick(_hoverSlot.slot, ["items"]);
			inventories[_hoverSlot.unit].slots[_hoverSlot.slot.slotNumber] = _.pick(slotTemp, ["items"]);

			if (updateInventories(inventories["first"], inventories["secound"])) {
				Nui.send("moveItem", {
					fromSlot: _hoverSlot.slot,
					toSlot: toSlot,
					count: _hoverSlot.count,
				});
				return true;
			}

			return false;
		}

		setHoverSlot(undefined);
		return true;
	}

	function hasItem(itemName: string, count: number, inventory?: types.IInventory) {
		// will for now only use first inventory
		const _inventory = inventory ?? playerInventory;

		const slotKey = _.findKey(_inventory.slots, (slotraw: types.ISlotData) => {
			const isCorrectStackOfItems = (_.first(slotraw.items)?.name ?? "") === itemName;

			if (isCorrectStackOfItems) {
				// ensure that the stack of items is not worn..
				const itemsThatAreUsable = slotraw.items?.filter((item) => {
					if (!item.expiresAt) return true;
					const expireDate = item.expiresAt instanceof String ? new Date(item.expiresAt) : item.expiresAt;
					return !dayjs().isAfter(expireDate);
				}) ?? [];

				console.log("xxxxxxxxxxxxxxxxxxxxxxx", count)
				return itemsThatAreUsable?.length >= count;
			}

			return false;
		});

		return slotKey;
	}

	function validateCrafting(itemToBeCrafted: string) {
		const itemDataToBeCrafted = itemData?.[itemToBeCrafted];

		if (itemDataToBeCrafted) {
			const itemsItemRequired = itemDataToBeCrafted.crafting?.itemsRequired ?? [];

			const hasAllItemsRequired = !itemsItemRequired.find((item) => {
				return !hasItem(item.itemName, item.amount);
			});

			return hasAllItemsRequired;
		}

		return false;
	}

	function validateCustomCrafting(itemToBeCrafted: string, recipe: types.Crafting) {
		if (itemData?.[itemToBeCrafted]) {
			const itemsItemRequired = recipe.itemsRequired ?? [];

			const hasAllItemsRequired = !itemsItemRequired.find((item) => {
				return !hasItem(item.itemName, item.amount);
			});

			return hasAllItemsRequired;
		}
		return false;
	}

	React.useEffect(() => {
		if (nearbyPlayers.length) {
			const _hoverSlot = _.cloneDeep(hoverSlot);
			setHoverSlot(undefined);

			if (_hoverSlot) {
				_hoverSlot.slot.items = _hoverSlot?.slot?.items?.length
					? _.take(_hoverSlot?.slot?.items, _hoverSlot.count)
					: [];
			}

			setGiveMenuProps({
				players: nearbyPlayers,
				slot: _hoverSlot?.slot,
				visible: true,
			});
		}
	}, [nearbyPlayers]);

	React.useEffect(() => {
		if (giveMenuProps) {
			setGiveMenuProps(undefined);
		}
	}, [playerInventory, secoundInventory]);

	function giveItem(playerId: string, slot: types.ISlot) {
		Nui.send("giveItem", {
			playerId,
			slot,
		});
		setGiveMenuProps(undefined);
		closeInventory();
	}

	function clearGiveMenu() {
		setGiveMenuProps(undefined);
	}

	function useItem(slot: types.ISlot) {
		const itemName = _.first(slot.items)?.name;

		if (itemName === "drivelicense") {
			Nui.send("getNearbyPlayers");
			return;
		}

		if (itemData?.[itemName ?? ""].closeOnUse) {
			closeInventory();
			setTimeout(() => {
				Nui.send("useItem", slot);
			}, 1500);
		} else {
			Nui.send("useItem", slot);
		}
		setHoverSlot(undefined);
	}

	function closeInventory() {
		Nui.send("closeUi", {
			secoundInventoryOwner: secoundInventory.owner,
			secoundInventoryType: secoundInventory.type,
			playerInventory: playerInventory.owner,
			playerInventoryType: playerInventory.type,
		});
	}

	useKeypress("Escape", () => closeInventory());

	const value: IGlobalInventoryContext = {
		playerInventory,
		secoundInventory,
		hoverSlot,
		setHoverSlot,
		moveItem,
		moveAmount,
		setMoveAmount,
		quickMoveItem,
		quickMove,
		closeInventory,
		useItem,
		hotbarVisible,
		itemData,
		balance,
		giveMenuProps,
		giveItem,
		clearGiveMenu,
	};

	return (
		<GlobalInventoryContext.Provider value={value}>
			{hoverSlot && <HoverItem {...hoverSlot.slot} />}
			{children}
		</GlobalInventoryContext.Provider>
	);
};

function useGlobalInventoryContext(): IGlobalInventoryContext | undefined {
	const context: IGlobalInventoryContext | undefined = React.useContext(GlobalInventoryContext);

	if (!context) {
		throw new Error("useGlobalInventoryContext: Must be used within a GlobalInventoryContext.");
	}

	return context;
}

export default useGlobalInventoryContext;
