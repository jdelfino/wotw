class Point < ActiveRecord::Base
  belongs_to :route
  validates :lat, numericality: true, presence: true
  validates :long, numericality: true, presence: true
  validates_uniqueness_of :order, :scope => [:route_id]
end
