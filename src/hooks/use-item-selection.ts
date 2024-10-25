import React from 'react';

type UUID = number | string;

export type KeyValue<DataItem> = Map<UUID, DataItem>;

export interface ItemSelectionApi<DataItem> {
  selectedItems: KeyValue<DataItem>;
  onToggleItem: (item: DataItem) => void;
  onToggleAll: () => void;
  onUnToggleAll: () => void;
  isPartiallySelected: boolean;
  isAllSelected: boolean;
  reinitialize: (initialSelectedItems?: KeyValue<DataItem>) => void;
  reinitializeData: (newData: DataItem[]) => void;
}

interface ItemSelectionProps<DataItem> {
  data: DataItem[];
  initialSelectedItems?: KeyValue<DataItem>;
  keyBy: (item: DataItem) => UUID;
  labelBy: (item: DataItem) => string;
}

function useItemSelection<DataItem>(props: ItemSelectionProps<DataItem>): ItemSelectionApi<DataItem> {
  const { initialSelectedItems = new Map(), keyBy } = props;
  const [dataItems, setDataItems] = React.useState<DataItem[]>(props.data);
  const [selectedItems, setSelectedItems] = React.useState<KeyValue<DataItem>>(initialSelectedItems);
  const [isPartiallySelected, setIsPartiallySelected] = React.useState(false);
  const [isAllSelected, setIsAllSelected] = React.useState(false);

  React.useEffect(() => {
    setIsPartiallySelected(selectedItems.size > 0 && selectedItems.size < dataItems.length);
    setIsAllSelected(dataItems.length > 0 && selectedItems.size === dataItems.length);
  }, [dataItems, selectedItems]);

  const onToggleItem = React.useCallback(
    (item: DataItem) => {
      const updatedMap = new Map(selectedItems);
      const key = keyBy(item);

      if (updatedMap.has(key)) {
        updatedMap.delete(key);
      } else {
        updatedMap.set(key, item);
      }

      setSelectedItems(updatedMap);
    },
    [selectedItems],
  );

  const onToggleAll = React.useCallback(() => {
    let updatedMap = new Map() as KeyValue<DataItem>;

    if (selectedItems.size < dataItems.length) {
      updatedMap = new Map(dataItems.map(item => [keyBy(item), item]));
    }

    setSelectedItems(updatedMap);
  }, [selectedItems, dataItems]);

  const onUnToggleAll = React.useCallback(() => {
    setSelectedItems(new Map());
  }, [selectedItems]);

  const reinitialize = React.useCallback((initialSelectedItems?: KeyValue<DataItem>) => {
    const updatedMap = initialSelectedItems || (
      new Map() as KeyValue<DataItem>
    );
    setSelectedItems(updatedMap);
  }, []);

  const reinitializeData = React.useCallback((newData: DataItem[]) => {
    setDataItems(newData);
  }, []);

  return {
    onToggleItem,
    onToggleAll,
    onUnToggleAll,
    isPartiallySelected,
    isAllSelected,
    reinitialize,
    selectedItems,
    reinitializeData,
  };
}

export default useItemSelection;
