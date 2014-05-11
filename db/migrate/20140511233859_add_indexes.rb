class AddIndexes < ActiveRecord::Migration
  def change
    add_index :points, [:route_id, :order]
  end
end
