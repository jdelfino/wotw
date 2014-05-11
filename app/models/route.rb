class Route < ActiveRecord::Base
  has_many :points, :dependent => :destroy
  accepts_nested_attributes_for :points, :reject_if => lambda { |a| a[:lat].blank? or a[:long].blank? }
end
