class CreatePoints < ActiveRecord::Migration
  def change
    create_table :points do |t|
      t.decimal :lat
      t.decimal :long
      t.references :route, index: true
      t.integer :order

      t.timestamps
    end
  end
end
